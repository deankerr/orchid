**This is the master document and source of truth for design decisions made that differ from the proposals.**

We're building a minimal version of the redesigned snapshot process.

- snapshot_at no longer has to be updated for each item

- "standard" model/endpoints process
- `processContext`
  - `sources` - integrated archival
  - `validator` - collects failed zod safe parse results, embedded in `sources`
  - `outputs` - flexible, combined entity output types.
    - still using previous db upsert methods/endpoints
    - skip metrics collection for now

current:
- compute what needs to be updated in the process (rather than one by one in the mutation)
  - do the metrics here
  - ? either action individually creates/updates each item, or a single mutation handles a modelEndpoint


---

Here’s a concrete, near-term roadmap for evolving the new snapshot system. I’ve grouped tasks by theme and added rationale, required code touch-points, and suggested order of execution so you can turn this into tickets quickly.

──────────────────────────────────
1. Output Design
──────────────────────────────────
Goal: replace the temporary “`outputToDB(ctx)`” helpers with a flexible, pluggable writer layer that can target Convex, log files, or dry-run console output.

A. Define the OutputHandler interface
   • Path: `convex/snapshots_v2/output.ts` (rename to `handlers.ts`?)
   ```ts
   export interface OutputHandler {
     name: string;                                      // “ConvexWriter”, “DryRun”
     init?(ctx: ActionCtx): Promise<void> | void;       // optional
     write(item: PipelineResult): Promise<void>;        // core method
     finish?(): Promise<void> | void;                   // flush, summary etc.
   }
   ```
   • `PipelineResult` is the union you hinted at in the proposal:
     ```ts
     type PipelineResult =
       | { kind: 'model'; value: OrModel }
       | { kind: 'endpoint'; value: OrEndpoint }
       | { kind: 'error'; source: string; message: string };
     ```

B. Implement concrete handlers
   1. `ConvexWriter`
      • Uses existing mutations (`or_models.upsert`, `or_endpoints.upsert`)
      • Internal queue + batch insert (e.g. `chunksOf(100)`) to cut write-amplification
   2. `DryRunWriter`
      • Pretty-prints to `console.log`, useful for local dev/test fixtures
   3. `FileWriter` (optional) _NO_
      • Streams JSONL to Bun’s fs sfor offline analysis

C. Modify `createProcessContext`
   • Accept a list of handlers (or config string → factory)  
   • Expose `processCtx.outputs.write(result)` which fans-out to all handlers

D. Remove the ad-hoc `modelEndpoints()` helper
   • Writers decide whether to diff, patch or ignore duplicates
   • The “state pre-load” (`processCtx.state.modelEndpoints()`) becomes an optimisation that only `ConvexWriter` needs

──────────────────────────────────
2. Metrics Handling
──────────────────────────────────
Goal: structured, queryable run metrics without polluting pipeline code.

A. Lightweight event emitter
   ```ts
   export interface MetricsSink {
     emit(event: MetricsEvent): void;
     flush(): Promise<void>;
   }
   type MetricsEvent =
     | { t: 'pipeline_started'; name: string; ts: number }
     | { t: 'pipeline_finished'; name: string; ts: number; counts: Record<string, number> }
     | { t: 'writer_stats'; writer: string; counts: Record<string, number> }
     | { t: 'error'; source: string; message: string };
   ```
   • Provide `createMetricsSink(ctx, run_id)` that internally buffers then
     patches `snapshot_runs`.

B. Instrumentation points
   • In `snapshot.ts` → emit run-level start/end  
   • In each process (e.g. `standard()`) → emit counts (`models`, `endpoints`, parse-errors)  
   • In each OutputHandler → emit write results (insert/stable/update)

C. Storage
   • Extend `snapshot_runs` document:
     ```ts
     metrics: {
       pipelines?: Record<string, { models: number; endpoints: number; errors: number }>
       writers?: Record<string, { insert: number; stable: number; update: number }>
       errors?: number
     }
     ```
   • Keep record small; raw logs can stay in archive or console.

D. Frontend hook (future)
   • Dashboard card that reads `metrics` to display “models processed”, “endpoints updated”, duration, error count, last successful run timestamp.

──────────────────────────────────
3. Prototype Flow Improvements
──────────────────────────────────
Shortcuts that give immediate value without large architectural shifts.

✓ Consolidation performance  
   • Use `Map.groupBy` only once; current code recalculates for every process loop.

✓ Endpoint enhancement  
   • Bake `output_tokens ||= context_length` directly during transform, not post-query patch.

✓ Parallel source fetching  
   • For each model variant, fire `sources.endpoints()` in parallel (Promise.all) instead of sequential for-loop.

✓ Error collection
   • `validator` already captures parse errors. Attach the raw payload’s SHA hash so we can de-dupe identical failures across runs.

✓ Remove stale-filter in DB list queries
   • Replace UI-side staleness filter ( `< 1 h` ) with a DB index (`snapshot_at desc`) plus `limit 1`, smaller payload to client.

──────────────────────────────────
4. Additional Considerations / Gaps
──────────────────────────────────
A. Archive Compaction
   • Define retention policy JSON (e.g. keep hourly × 30 d, daily × 365 d, delete older)  
   • Cron job calls `archive.compact()` and logs reclaimed bytes

B. Concurrency Limits
   • Add `config.maxConcurrency` to `RunConfig` and pass to `asyncMap()` (convex-helpers has a limiter).

C. Fixture Source Adapter
   • `createSources({ sources: 'fixtures', path: 'tests/golden/*.json' })` to enable CI snapshots without hitting network.

D. Type-level Safety
   • Generate `type Sources = ReturnType<typeof createSources>` and pipe through everywhere so transforms stay in sync.

E. Health checks & alerts
   • If a run produces 0 models or endpoints, mark `ok: false` and surface in dashboard.

F. Migration plan
   • Gradually redirect v1 cron to call `snapshots_v2.runDemo`  
   • Once parity is confirmed, delete v1 pipeline files and mutations.

──────────────────────────────────
5. Suggested Execution Order
──────────────────────────────────
1. OutputHandler interface + DryRunWriter (fast feedback loop)  
2. ConvexWriter (reuse existing mutations, then optimise batching)  
3. Integrate MetricsSink & emit basic events  
4. Replace `outputToDB` in `standard.ts` with new handler call  
5. Parallelise endpoint fetching + optimise consolidateVariants  
6. Archive compaction + retention cron  
7. Fixture Source Adapter + CI task  
8. Frontend metrics dashboard + alert edge-case logic  
9. Decommission legacy pipeline

This plan should get the snapshot v2 system production-ready while preserving the rapid-iteration spirit of the current prototype.
