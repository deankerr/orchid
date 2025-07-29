# ORCHID Snapshot & Processing System – Redesign Overview (Draft v1)

## 1 Goals

• Separate concerns so that **fetch, validation, transform, and write** can evolve independently.  
• Make every step pluggable through **dependency-injection** (live API, archives, fixtures).  
• Preserve the principle that **derived state is expendable**; raw snapshots remain the single source of truth.  
• Provide fine-grained scheduling, throttling, and manual triggers.  
• Keep storage growth bounded with tiered retention.  
• **Remove pre-loading complexity** - processes fetch data directly via typed sources as needed.  
• Remove obsolete complexity (strict schemas, changes tables, split success/error results).

---

## 2 High-Level Flow

```mermaid
flowchart TD
  subgraph Time
    Scheduler -->|enqueue job| Orchestrator
  end
  Orchestrator -->|build DAG| ProcessEngine
  ProcessEngine -->|run| Pipelines
  Pipelines -->|raw data| ArchiveService
  Pipelines -->|results[]| OutputHandlers
  ProcessEngine -->|metrics| Orchestrator
  Orchestrator -->|update| SnapshotRunsTable
```

---

## 3 Major Services / Modules

### 3.1 Scheduler
Determines **when** to enqueue a `SnapshotJob` (cron interval, jitter, or manual trigger). Stores intent in `snapshot_runs` with status `queued`.

### 3.2 Orchestrator
Reads the queued job, stamps `snapshot_at` (hour-aligned), fetches **Context**, and builds a **ProcessGraph** (dependencies among pipelines). Delegates execution to the Process-Engine and marks the run `ok|error` afterwards.

### 3.3 Context Object
**IMPLEMENTED** - ProcessContext object provided to every process:

• `config: RunConfig` with `snapshot_at`, `run_id`, `sources` type  
• `sources: Sources` - typed sources with automatic archival and transforms  
• `outputs: Outputs` - simple record of output handler functions  
• `ctx: ActionCtx` - Convex context  

No pre-loading - processes fetch data on-demand through sources.

### 3.4 Process-Engine
Executes the DAG with concurrency limits. Collects a **single `results[]` array** from every pipeline (objects may contain `kind`, `data`, `error`, etc.). Success vs. error handling is deferred to the Output-Handler layer.

### 3.5 Source-Adapters (normalized)
**IMPLEMENTED** - Unified `createSources(ctx, config)` function creates typed sources based on `config.sources`. Sources return `ZodSafeParseResult[]` arrays with both success and error results.

**Type-Safe Sources**:
• `models: Source<ModelType>` - no params, returns transformed models  
• `endpoints({ permaslug, variant })` - typed params, returns transformed endpoints  
• `apps({ permaslug, variant })` - typed params, returns app leaderboard data  
• `providers: Source<ProviderType>` - no params, returns provider info  
• `uptimes({ uuid })` - typed params, returns uptime history  
• `modelAuthor({ authorSlug })` - typed params, returns author + token stats  

**Adapters**:
• Remote sources (live API + automatic archival)  
• Archive sources (replay from stored data)  
• Future: Fixture sources (tests)

### 3.6 Validation & Transform Helpers
**IMPLEMENTED** - Transform system in `/transforms/` with single zod schemas that:
• Extract relevant fields from OpenRouter API responses  
• Apply light validation with `.safeParse()`  
• Transform field names/formats (e.g., `created_at` → `or_created_at: timestamp`)  
• Return `ZodSafeParseResult` (success/error) without filtering  

No strict schemas - transforms are applied automatically in source `retrieve()` methods.

### 3.7 Pipelines (pure functions)
Do exactly five things:

1. Fetch raw data via SourceAdapter.  
2. `storeRaw(type, key, data)` to Archive-Service.  
3. Transform/normalize into DTOs; run any lightweight validation.  
4. Return a **flat `results[]` array** (e.g. `{ entity: 'model', value: dto }`, `{ error: 'Bad price field' }`).  
5. Emit high-level metrics (`started_at`, `ended_at`, counts).

They **never** touch Convex directly.

### 3.8 Output-Handlers
Consume the `results[]` array and decide what to do per item:

• `ConvexWriter` (insert/replace/patch)  
• `DryRunWriter` (console.log)  
• `FileWriter` (dump JSON)

All diffing logic that used to sit in Convex mutations is simplified thanks to the pre-loaded baseline data (models/endpoints).  Derived entities can now be overwritten wholesale or intelligently patched – up to the handler.

### 3.9 Archive-Service
Unified helper to gzip + store raw responses, maintain metadata, and enforce retention/compaction. Continues to be the **authoritative change record**.  Since the frontend doesn’t consume change logs yet, detailed change tracking tables are **deprecated** for now.

### 3.10 Derived Projections
Optional, idempotent jobs that read snapshot tables and build fast query views (rolling stats, leaderboards). Because we can regenerate them at will, they are isolated from the core snapshot flow.

### 3.11 Observability
Every pipeline returns a metrics object; Process-Engine aggregates them and stores on `snapshot_runs`.  Future work: forward structured events to Grafana/Loki.

### 3.12 Test Harness
CLI: `bun run orchid:snapshot:test --snapshot_at=…` spins up Process-Engine with `FixtureReader` + `DryRunWriter` so golden files can be asserted.

### 3.13 Admin & Dev Surfaces
Dashboard cards for schedule editing, live run status, archive browser, and one-click replay.

---

## 4 Deprecations & Simplifications

• `*_changes` tables and their diff logic will be removed—raw archives are the canonical diff source.  
• Strict zod “StrictSchema” definitions are no longer required; only transformation helpers remain.  
• Pipelines produce a unified `results[]` array; Output-Handlers interpret success vs. error.  
• Rolling window arrays stored inside docs will move to dedicated stats tables (size guard).  
• Existing Convex mutations that embed validation/diffing will be rewritten as Output-Handlers or removed.

---

## 5 Next Steps

1. Define the TypeScript interfaces for **SourceAdapter**, **OutputHandler**, and `PipelineResultItem`.  
2. Spike a minimal Process-Engine that runs current `models` pipeline with `LiveOpenRouter` + `DryRunWriter`.  
3. Replace Convex mutation logic with new Output-Handler abstraction.  
4. Delete unused `*_changes` tables after verifying no consumer relies on them.  
5. Draft retention policy and archive compaction plan.

---

## 6 Current Implementation Status

**COMPLETED Components**:

### 6.1 Transform System (`/transforms/`)
- **All OpenRouter transforms implemented**: models, endpoints, apps, providers, uptimes, modelAuthor
- **Single schema per transform**: No strict validation, exports named after filename (e.g., `export const models`)
- **Automatic field transformation**: API fields → internal fields with proper typing
- **Combined transforms**: `modelAuthor` combines author info + token stats from single endpoint

### 6.2 Sources System (`/sources.ts`)
- **Unified `createSources()` function**: Takes `ActionCtx` and `RunConfig`, returns typed sources
- **Type-safe parameters**: All function parameters properly typed (e.g., `{ permaslug: string; variant: string }`)
- **Automatic archival**: Remote sources automatically archive raw responses with metadata
- **Dual source support**: Same interface for live API vs archived data
- **Full OpenRouter API coverage**: All endpoints from original system

### 6.3 Process Context (`/types.ts`, `/snapshot.ts`)
- **Typed ProcessContext**: `ProcessContext<Sources>` with full type inference
- **Clean dependency injection**: `sources`, `outputs`, `config`, `ctx` injected
- **No pre-loading**: Processes fetch data on-demand through sources

### 6.4 Standard Process (`/processes/standard.ts`)
- **Working implementation**: Processes models → consolidates variants → creates endpoints
- **Success/error filtering**: Handles zod parse results appropriately
- **Model variant consolidation**: Uses existing logic to dedupe variants
- **Endpoint enhancement**: Adds model data to endpoint records

### 6.5 Archive System (`/archive.ts`)
- **Compression + storage**: Gzip compression with SHA256 checksums
- **Metadata tracking**: Stores run_id, snapshot_at, type, params for retrieval
- **Parameter encoding**: Search params concatenated with dashes for unique identification

**Key Design Decisions Made**:
- **No separate transform method**: Sources return `ZodSafeParseResult[]` directly from `retrieve()`
- **No result filtering in sources**: All results (success + errors) passed to process layer
- **Type inference from implementation**: `Sources` type inferred from `createSources()` return value
- **Simplified context**: Removed pre-loading complexity, processes fetch on-demand

---

_This document describes the architecture at a conceptual level; each service can now be expanded in separate design notes and technical spikes._ 
