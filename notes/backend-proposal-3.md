Below is a “clean-slate” plan for ingesting, storing and querying OpenRouter **model-centric** data given what we now know about the payloads, duplication, size and runtime limits.

1.  What the endpoints actually give us

A. GET /api/v1/models  
 • ~3 KB, stable, returns `{ id, name, … }[]` – the **authoritative list of modelKeys**  
 • Only field we truly care about is `id` (`permaslug[:variant]`).

B. GET /api/frontend/models  
 • 1.5-2 MB uncompressed, ~2000 objects.  
 • Each object = **model snapshot** with one _featured_ endpoint embedded.  
 • Keys duplicated across every object → gzip ≈ 100-150 kB.

C. GET /api/frontend/stats/endpoint?permaslug=…&variant=…  
 • One call per model/variant.  
 • Returns **array of endpoint snapshots** (0-N items).  
 • Each endpoint embeds full _model_ and _provider_ objects (massive duplication).  
 • Contains current `stats` (`p50_latency`, `p50_throughput`, `request_count`).

D. Metrics endpoints  
 • throughput-comparison, latency-comparison, uptime-recent, uptime-hourly…  
 • Strictly **time-series** → better in a separate table; we never store the raw JSON blob because we only need (date, value).

E. Author/versions/app-stats  
 • Nice-to-have metadata; very small; same storage strategy as C.

Key fields per **endpoint** we actually care about (all UI & analysis use-cases are covered by ≤ 25 scalars / small arrays):

    endpointId, providerSlug, providerDisplayName, modelKey,
    contextLength, variant, quantization?, isFree, isHidden, isDisabled,
    pricing: { prompt, completion }, supportsImages, supportsTools,
    p50Latency?, p50Throughput?, requestCount?,
    limitRPM?, limitRPD?, dataPolicy.training?, dataPolicy.retainsPrompts?

Everything else may be useful later, but we can fetch it on-demand from the stored blob.

2.  Storage & schema – revised

Legend: `Id<'table'>` = Convex Id helper type

A. runLog (NEW) – one document per sync run  
 • `_id` Id<'runLog'>  
 • `startedAt` number (ms)  
 • `endedAt` number | null  
 • `modelsFetched`/`endpointsFetched` number  
 • `bytesRaw`/`bytesGz` number  
 • `errors` v.optional(v.string())

_Purpose_: a stable “runId” we can reference from every other row.  
 _Benefit_: eliminates per-entity `version`; a snapshot’s identity = `(runId, entityKey)`.

B. modelSnapshots – **one row per model per run**  
 • `runId` Id<'runLog'> (indexed)  
 • `modelKey` v.string() (indexed)  
 • `hash` v.string() (sha-256 of canonical JSON)  
 • `blob` v.bytes() (gzip of full model object)

_Size_: ~2-5 kB/gz per model ⇒ 2 k models × 5 kB ≈ 10 MB / run.  
 _Memory_: processed one model at a time.

C. endpointSnapshots – **one row per endpoint per run**  
 • `runId` Id<'runLog'>  
 • `endpointId` v.string() (indexed)  
 • `modelKey` v.string() (indexed)  
 • `hash` v.string()  
 • `blob` v.bytes() (gzip)

_Size_: 200-800 B/gz each. 50 k endpoints ⇒ 40 MB / run at worst – acceptable if runs are hourly & TTL prunes after N days.

D. endpointProjections – **current state only**  
 • `endpointId` v.string() (primary key, indexed)  
 • `modelKey` v.string() (index)  
 • `providerSlug` v.string() (index)  
 • `data` v.object({...25 fields above})  
 • `runId` Id<'runLog'> // when last seen  
 • `active` v.boolean() // tombstoned when missing in a run

_Usage_: fast UI list/filter. <15 bytes per field ⇒ ~1.5 MB for 50 k endpoints.

E. endpointMetrics – **time-series (rolled up)**  
 • `endpointId` v.string() (index)  
 • `bucket` "hour" \| "day"  
 • `timestamp` number (ms at bucket start)  
 • `p50Latency` / `p50Throughput` v.number()  
 • `uptime`? v.number()  
 • Aggregated by a follow-on cron; raw hourly JSON never stored.

No `diffs` table for now – we can reconstruct by loading two blobs and doing fast-json-patch in memory when needed.

3.  Sync pipeline (v2)

All jobs use **stream-processing**, never hold more than one decompressed model + its endpoints in RAM.

Step 0 – startRun (internalAction)  
 • insert runLog row → get runId  
 • stats = { modelsFetched:0 … }

Step 1 – fetchModelKeys  
 • GET /api/v1/models → array of ids  
 • push each id into scheduler queue `sync.fetchModel({ runId, modelKey })`

Step 2 – sync.fetchModel (internalAction, one per modelKey)  
 • GET /api/frontend/models? (optional) – **OR** pull single object from cached big list if we already downloaded it.  
 • GET /api/frontend/stats/endpoint?permaslug=…&variant=…  
 • Build endpoint projections & insert endpointSnapshots rows.  
 • Insert modelSnapshots row.  
 • Update `runLog` counters with `ctx.db.patch`.

    Memory use: ≈ 200 kB worst-case.

Step 3 – finaliseRun (internalMutation)  
 • mark runLog.endedAt = now.  
 • **Tombstone sweep**: any endpointProjection where `runId < currentRunId && active==true` → `active=false`.  
 • Optionally GC old snapshot rows older than retention horizon (e.g. 14 days).

Cron schedule: every **2 h** until we prove rate-limit safety.  
Retention: keep 24 h of per-run snapshots + daily roll-up for 180 days ⇒ well under Convex 1 GB free tier.

4.  Validation strategy

The JSON is huge and lossy-typed; strict validation burns CPU and RAM.  
Adopt **two-layer Zod**:

    const EndpointLite = z.object({
      id: z.string(),
      model_variant_permaslug: z.string(),   // our modelKey
      provider_slug: z.string(),
      context_length: z.number(),
      variant: z.string(),
      quantization: z.string().nullable(),
      is_free: z.boolean(),
      is_hidden: z.boolean(),
      is_disabled: z.boolean(),
      pricing: z.object({
        prompt: z.string(),
        completion: z.string(),
      }),
      stats: z.object({
        p50_latency: z.number().optional(),
        p50_throughput: z.number().optional(),
        request_count: z.number().optional(),
      }).optional(),
    }).passthrough();

1.  Parse **only** EndpointLite (≤ 40 keys) – cheap.
2.  Re-stringify the **entire raw payload** and gzip without inspecting it further.  
    (Avoids OOM, still keeps full fidelity for later deep dives.)

3.  Why this is better / different

• **runId vs version**  
 – Simpler semantics (“what did OR look like at 14:00?”)  
 – Disappearance handling is automatic (entity absent in run ⇒ not active).  
 – Saves 1 index per table; no optimistic-lock dance.

• **Per-entity row + gzip**  
 – Duplicated keys collapse 10-15×; even with embedded provider/model blobs we’re at sub-KB per endpoint.  
 – Works under Convex’s 1 MB/object & 64 MB runtime RAM.

• **Streamed sync**  
 – Keeps peak memory low (single model in memory).  
 – Parallelisable across scheduler workers if Convex plan upgrades permit.

• **No code-gen diffs**  
 – Very cheap to recompute on demand; defer complexity until we _need_ per-field change feeds.

• **Metrics isolated**  
 – Time-series rows are tiny, aggregatable, and never clog our snapshot tables.

6. Implementation milestones

7. `bun add fast-json-patch zod pako @types/node`.
8. convex/schema.ts – add tables A-E above.
9. convex/openrouter/fetch.ts – shared fetch with retry & gzip helper.
10. convex/projections/endpoint.ts – derive 25-field lite object.
11. actions: run.startRun, fetchModel, run.finaliseRun.
12. cron.ts – schedule every 120 min.
13. React: `usePaginatedQuery(api.listActiveEndpoints)` with filters → drives UI.
14. Grafana-style admin page reading runLog + runStats for monitoring.

This plan is essentially the same hybrid philosophy as v1 (raw + projection) but:

• Moves to **runId** instead of per-entity version.  
• Collapses model+endpoints into a **single compressed snapshot** per modelKey.  
• Treats metrics as first-class time-series from day 1.  
• Guarantees we won’t blow the 64 MB memory ceiling, even if OpenRouter doubles in size.
