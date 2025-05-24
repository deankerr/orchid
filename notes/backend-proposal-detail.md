# ORCHID Back-End 2.0 – Detailed Scenarios, Requirements & Refined Design

---

## A. Stories (Real-world usage scenarios)

1. "Cheapest-Price Hunter"  
   • Alice opens the dashboard and filters for _image-capable_ endpoints under $0.0000004 / prompt-token.  
   • An hour later Fireworks drops its price; Alice reloads and immediately sees the new cheapest entry.

2. "Vanishing Endpoint"  
   • Yesterday DeepInfra exposed a Llama-4 Scout endpoint.  
   • Today the hourly sync sees the UUID missing → marks it **inactive**.  
   • Bob notices the disappearance in the change-log and knows why his prod prompt failed.  
   • Two days later the endpoint re-appears with a new price; it is re-activated with _version +1_.

3. "Stat-driven Provider Choice"  
   • Carol looks at throughput graphs for all Llama-4 Scout endpoints over the past month.  
   • She spots Groq's 6 k tok/s p50 and switches her workload.

4. "Schema Surprise"  
   • OpenRouter silently adds `quantized_latency` to the stats blob.  
   • The next sync stores the new field in the compressed snapshot; projection code _ignores_ it until we explicitly surface it.

5. "Price Trend Exploration"  
   • A researcher downloads a CSV of prompt/completion pricing for GPT-4o over time for a paper on market dynamics.  
   • The dataset is generated from stored snapshots – no re-querying OR.

6. "Annotation Layer"  
   • Dave benchmarks GPT-4o Mini vs Llama 4 Scout, attaches markdown notes & a custom "accuracy" score to each endpoint.  
   • The notes survive upstream changes and are shown side-by-side with vendor stats.

---

## B. Requirements & Challenges distilled from stories + samples

Vendor Data  
R1 Store **exact** upstream payloads (providers, models, endpoints, stats) so every field is preserved.  
R2 Detect _change, addition, deletion, re-appearance_.  
R3 Make common UI queries fast (price filters, capability flags) without parsing huge blobs client-side.  
R4 Track numeric time-series (pricing & latency) for charting.

Local Overlay  
R5 Allow arbitrary user annotations keyed by the same IDs.  
R6 Overlay must survive upstream churn.

Operational  
R7 Hourly sequential sync (providers → models → each model's endpoints).  
R8 Must never fail fatally on schema drift – log, keep raw blob, skip projection if needed.  
R9 Fit Convex's 1 MB per-doc limit (largest gzipped response observed ≈ 150 kB).  
R10 Handle bloom of endpoint stats rows (potential 10k/day) via roll-ups & TTL.

---

## C. Refined Hybrid Storage Design

1. entitySnapshots (table, **append-only**)  
   _Purpose: immutable history & diff source_

   - entityType : `"provider" | "model" | "endpoint"`
   - entityKey : model ID / endpoint UUID (simplified from multiple slug types)
   - version : int (monotonic per key)
   - hash : SHA-256 of normalised JSON (dedup)
   - snapshot : `v.bytes()` gzipped UTF-8 JSON
   - active : boolean (true until first _missing_ sweep)  
     Indexes: `by_key`, `by_active`, `by_hash`

2. entityProjections (table, **mutable current state**)  
   _Purpose: fast UI queries_

   - entityType / entityKey / version
   - data:  
     • Provider: `{ displayName, headquarters?, byokEnabled, hasChat, … }`  
     • Model: `{ id, name, author, contextLength, supportsImages, supportsFiles, cheapestPricePrompt, cheapestPriceCompletion }`  
     • Endpoint: `{ id, modelId, providerName, contextLength, isFree, promptPrice, completionPrice, supportsImages, supportsTools, status, p50Latency?, p50Throughput? }`
   - tombstone: boolean (false default)  
     Hot indexes:  
      • `by_type_price`, `by_modelId`, `by_provider`, `by_capability`, etc.

3. endpointStats (table, **time-series**)

   - endpointId
   - sampleTime (Unix seconds)
   - p50Latency, p50Throughput, requestCount  
     Roll-up cron aggregates hourly → daily to control size.

4. annotations (table)

   - entityType / entityKey
   - authorId?
   - tags [], score object, markdown notes

5. diffs (optional table)
   - snapshotIdPrev, snapshotIdNew, patch (RFC-6902 bytes)  
     Saves CPU when UI needs a diff view.

---

## D. Data Model Simplification

**Previous confusing structure:**

- `model.slug` - shared between variants
- `model.permaslug` - versioned slug
- `model.id` - unique identifier
- `endpoint.modelVariantSlug` - references model.id
- `endpoint.modelVariantPermaslug` - references model.permaslug

**Simplified structure:**

- `model.id` - single unique identifier (e.g., `"openai/gpt-4"`)
- `endpoint.modelId` - references model.id directly

This eliminates confusion and makes relationships crystal clear. The various slug fields are still parsed from the API but not used in our projections.

---

## E. Sync Pipeline (Convex actions & crons)

Step 0: helpers  
• `fetchJson(url)` with retries/back-off.  
• `normalize(obj)` – remove embedded provider/model blobs from endpoints before hashing.  
• `hash(obj)` → SHA-256 hex.  
• `buildProjection(entityType, obj)`.

Step 1: syncProviders (hourly)

1. Download single JSON (≈1 MB).
2. For each provider record: upsert snapshot/projection (Algorithm A below).
3. Build `seenKeys` set. Any provider key in projections _not_ seen → mark tombstone.

Step 2: syncModels (hourly, after providers)  
• Same as providers (single list).  
• Use `model.id` as the primary key for projections.

Step 3: syncEndpointsForModel(modelId)  
• GET `/stats/endpoint?permaslug=…` for each variant.  
• Algorithm A per endpoint.  
• Stats object extracted → insert endpointStats row.  
• Link endpoints to models via `modelId` field.

Algorithm A (upsert)

```
prev := ctx.db
  .query("entityProjections")
  .withIndex("by_key", q => q.eq("entityKey", key))
  .unique()

if !prev || prev.hash != newHash:
    ver := prev ? prev.version + 1 : 1
    snapId := ctx.db.insert("entitySnapshots", { …, version: ver, hash, snapshot })
    if prev:
        diff := jsonPatch.generate(prevSnapshot, newObj)
        ctx.db.insert("diffs", { snapshotIdPrev: prevSnapId, snapshotIdNew: snapId, patch: diff })
    ctx.db.patch(prev?._id ?? newId, { version: ver, data: buildProjection(…) , tombstone: false })
```

Sweep job (runs after each sync batch)  
• For every active projection not touched in last run → `tombstone = true; active = false` in snapshot.

Re-appearance  
• Treated like any other change → new snapshot with `version++`, tombstone cleared.

---

## F. How the Design Handles Potential Circumstances

| Circumstance            | Handling                                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Price flip              | New snapshot, new projection; time-series record in endpointStats; UI graphs update.                                          |
| Field added / removed   | Stored in raw snapshot (ignored in projection unless we map it). No runtime error.                                            |
| Endpoint deleted        | Missing in sweep → tombstone. Still query-able through timeline/history screens.                                              |
| Endpoint returns        | New version; tombstone cleared; gap visible in history graph.                                                                 |
| Exceed 1 MB             | Pre-compression + dedup provider/model blobs; fallback chunk snapshots per 500 kB "pages".                                    |
| API outage              | Action logs error, scheduler retries; last known projections remain visible.                                                  |
| Projection build throws | Snapshot still written, but projection upsert skipped. Alert surface via metrics; once fixed we can recompute from snapshots. |
| Stats flood             | Hourly cron converts raw per-fetch samples to daily p50/p95; older raw rows TTL-delete after 7 days.                          |
| Storage growth          | Gzip (~10-20×) + append frequency (~50–100 k/day) ⇒ years before 10 GB. Policy: cold-archive snapshots > 18 months.           |

---

## G. Next-Step Implementation Map (incremental)

0. `bun add fast-json-patch @types/node zod` (hashing via `crypto.subtle` or `bun:crypto`).
1. `convex/schema.ts` – scaffolding tables above (use hybrid validators: raw blobs as `v.bytes()`, projection objects typed).
2. `convex/openrouter/fetch.ts` – shared fetch util with retries.
3. `convex/openrouter/normalize.ts` – strip nested model/provider from endpoint.
4. `convex/projections/*.ts` – three small pure functions.
5. `convex/sync/providers.ts`, `models.ts`, `endpoints.ts` – use new Convex _action_ syntax with `internalAction` & `mutation` helpers.
6. `crons.ts` – schedule provider+model lists hourly; enqueue endpoint jobs per model with jitter.
7. React hooks:  
   • `usePaginatedQuery(api.listModels)` hits projections.  
   • Detail pages call `api.getEndpointHistory`, `api.getPriceSeries`.
8. Admin dashboard shows failing projection builds & storage growth.

---

## H. Outstanding Questions / Validation Points

1. **Snapshot Granularity** – Store one giant "provider-list" blob vs per-provider row? Current design chooses per-row for uniformity; confirm performance (list is only ~170 providers).
2. **Compression library** – Use builtin `Bun.compress` vs external `pako`? Need Node fallback for Cloud runtime.
3. **Diff storage** – Pre-compute & store patch (saves CPU) **or** generate on demand (saves space)?
4. **Stat Sampling Frequency** – Endpoint stats API appears to update ~hourly; confirm before deciding hourly vs 15-min fetch.
5. **Deletion semantics** – is "missing for N syncs" enough to tombstone, or require explicit 404?
6. **Rate limits** – Not documented; capture headers in fetch util to auto-slow-down.
7. **Auth / API key** – Front-end endpoints are public today; but OR could gate them behind auth in future. Plan for key injection.

---

## I. Conclusion

This refined hybrid design keeps ORCHID resilient, query-friendly, and historically rich:

• **Simplified relationships**: Clear `model.id` ↔ `endpoint.modelId` references eliminate confusion.  
• **Snapshots** preserve 100% upstream fidelity.  
• **Projections** keep the UI snappy with indexed, typed objects.  
• **Stats** and **annotations** live in separate purpose-built tables.  
• Sync actions are idempotent, fault-tolerant, and easy to evolve.

When upstream inevitability strikes—deleted endpoints, new fields, pricing volatility—the dashboard gracefully tracks, visualises, and alerts without losing data or throwing runtime errors.

The data model simplification makes the system much easier to understand and work with, while maintaining full backward compatibility with the OpenRouter API structure.
