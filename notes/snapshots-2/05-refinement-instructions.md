# ORCHID Snapshot v2 — Refinement Brief (Agent-Facing)

This brief replaces the previous draft.  It describes **exactly** the parts an AI-coder must refine inside the existing snapshot_v2 prototype.  Nothing outside this scope is referenced.

---

## 0. Core Tenets

1. **Dependency-Injection**: every piece receives only what it needs (ctx, sources, cfg, …).
2. **Small, synchronous steps**: we work with regular arrays; entity counts are low.
3. **Single-source truth**: the transform owns entity shape; all later stages treat it as opaque POJOs.
4. **Clear hand-offs**: Validation → Comparison + Metrics → Output.  Each stage mutates nothing, only produces new data for the next.
5. **Composable metrics**: uniform records `{ name, total, insert, update, stable }` aggregated per table.
6. **Minimal naming friction**: file & symbol names describe intent in plain English.

---

## 1. SnapshotEngine (formerly `runSnapshot`)

`engine.ts`
```ts
export async function run(ctx: ActionCtx, config: RunConfig): Promise<RunReport>
```
Responsibilities:
1. **Init** – capture `startedAt`, build sub-systems:
   * `sources` (remote | archive)    
   * `validator` (error collector)    
   * `metrics`   (aggregator helper)  
   * `outputs`   (ConvexWriter + LogWriter)
2. **Run Process** – call `standard(processCtx)` once.
3. **Flush** – await `outputs.finish()`.
4. **Assemble RunReport** – duration + `metrics.all()` + `validator.errorCount()`.
5. **Return** – caller will persist RunReport.

Design notes:
* Keep the signature narrow; no hidden globals.  
* Engine **owns timing**; processes just push metric records to the provided helper.

---

## 2. Sources

Folder: `sources/`

```ts
interface Sources {
  models(): Promise<Model[]>;
  endpoints(q: { permaslug: string; variant: string }): Promise<Endpoint[]>;
  apps(...): Promise<App[]>;      // unchanged, still needed by process later
  providers(): Promise<Provider[]>;
  uptimes(q: { uuid: string }): Promise<Uptime[]>;
  modelAuthor(q: { authorSlug: string }): Promise<ModelAuthor>;
}
```

Key tasks for clean-up:
* **RemoteSource** – handles fetch + transform + optional archive write.
* **ArchiveSource** – loads and transforms from stored blobs.
* `createSources(ctx, cfg)` chooses one & returns `Sources` object.
* Remove archival logic from each method; wrap them once with a `withArchival` decorator so tests can disable it.

---

## 3. Validation + Transform

These two steps are inseparable: the transform already calls `schema.safeParse(raw)`.  We **collect** errors and pass **validated entities** forward.

```ts
const [valid, issue] = validate(raw, schema, meta)
```
* If `issue` exists → push into `validator.add(issue)`.
* If `valid` exists → push into the return array.

`validator` provides:
```ts
validator.add(issue)
validator.errorCount()
validator.getIssues()   // for LogWriter if desired
```
`Issue` structure already exists; keep it.

Why separate objects? – the transform must stay pure & testable, while validator handles side-effects (issue storage or console output).

---

## 4. Comparison (aka Diff) + Metric Gathering

Introduce **DecisionOutcome** (better name than PipelineResult):
```ts
type DecisionOutcome =
  | { kind: 'insert'; table: string; value: any }
  | { kind: 'update'; table: string; value: any; id: Id<any> }
  | { kind: 'stable'; table: string; id: Id<any> };
```

Helper `decide(table, next, prev?)` performs:
1. Primary-key match (exported per table, e.g. `OrModels.key = (m) => m.slug`).
2. Deep equality check (fast `===` for primitives + `JSON.stringify` fallback is fine).
3. Return appropriate `DecisionOutcome`.
4. At the same time call `metrics.record(table, kind)` where:
```ts
metrics.record(name: string, kind: 'insert' | 'update' | 'stable')
```
This updates a map: `{ name, total, insert, update, stable }` per entity type.

`metrics.all()` returns an array of those maps.

---

## 5. Output Handlers

Unified interface:
```ts
interface OutputHandler {
  init?(): Promise<void>;
  write(item: DecisionOutcome): Promise<void>;
  finish?(): Promise<void>;
}
```
* **ConvexWriter** – buffer items per table, flush in chunks of ~100 on `finish()` (or earlier if needed). Supports insert & update.
* **LogWriter** – increments counters + prints summary in `finish()`.
* Additional handlers can be added later; interface stays stable.

---

## 6. Process: `standard`

Flow (verbose):
1. `models = sources.models()`
2. `consolidated = consolidateVariants(models)` (logic unchanged)
3. For each **consolidated model**:
   1. enrich meta (`snapshot_at`, etc.)
   2. `endpoints = sources.endpoints({ permaslug, variant })` *per variant*
   3. enhance each endpoint with capabilities     
4. Build index maps of **existing** db state through `state.existingModels()` / `existingEndpoints()`.
5. For every model / endpoint call `decide(...)` and:
   * `outputs.write(outcome)` for non-stable outcomes.
6. Return nothing; metrics already collected.

---

## 7. Metrics Shape

```ts
interface EntityMetric {
  name: string;      // e.g. 'or_models'
  total: number;     // total examined for this entity type
  insert: number;
  update: number;
  stable: number;    // no-op
}

interface RunReport {
  startedAt: number;
  endedAt: number;
  durationMs: number;
  metrics: EntityMetric[];
  errors: number;     // validation issues
}
```

---

## 8. Deliverables Checklist

1. `snapshotEngine.ts` (new) replacing legacy `snapshot.ts` logic.
2. `sources/` folder with `remote.ts`, `archive.ts`, `index.ts` (with archival decorator).
3. `validation/` folder – existing file refactored into `validator.ts`.
4. `comparison/decision.ts` (generic diff + metrics hook).
5. `outputs/convexWriter.ts`, `outputs/logWriter.ts` updated to new interface.
6. `processes/standard.ts` updated to new flow & names.
7. Update imports across the codebase.
