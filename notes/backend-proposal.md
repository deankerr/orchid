# ORCHID - Backend Redesign Report

0. TL;DR  
   • Stop trying to coerce OpenRouter data into narrow, strongly-validated tables.  
   • Persist the raw snapshots, keep them small, diff them to track evolution, and extract only the _few_ fields the UI actually uses into “projection” tables for fast queries.  
   • Separate long-term metrics (stats) from structural snapshots.  
   • Add an “overlay” namespace for our own annotations/tests.  
   • Everything lives in Convex; scheduled actions pull data, create snapshots, compute diffs, update projections, and publish changes to the React client in real-time.

---

1. Purpose of ORCHID

---

• Give users a **dashboard** to discover, compare and monitor AI **Models**, **Endpoints** and **Providers** available on OpenRouter.  
• Track how those entities evolve (price, context length, status, new capabilities, etc.).  
• Accumulate independent metrics (benchmarks, health tests, usage notes) alongside the vendor data.  
• Expose all of it through Convex queries to the Next.js frontend – no public REST API.

---

2. Key Concepts & Entities

---

| Entity (shared key = slug/modelKey/id) | Vendor data                         | Ours                                 | Lifetime       |
| -------------------------------------- | ----------------------------------- | ------------------------------------ | -------------- |
| Provider                               | raw provider JSON snapshot          | annotations, privacy flags           | rarely deleted |
| Model                                  | raw model JSON snapshot             | human curation, extra links          | rarely deleted |
| Endpoint                               | raw endpoint JSON snapshot          | synthetic scores, health tests, tags | high churn     |
| Metrics (EndpointStats)                | numeric samples/roll-ups            | calculated aggregates                | time-series    |
| Diff                                   | JSON Patch between old/new snapshot | —                                    | append-only    |

Supporting concepts  
• Snapshot: the exact payload returned by OpenRouter at time **T** (never mutated).  
• Projection: a _lean_ object containing only the fields the UI needs for listing & filtering (denormalised for speed).  
• Annotation: free-shape record we control (markdown, booleans, scores, etc.).  
• Version: monotonically increasing integer per entity; used to build diffs.

---

3. Storage & Processing Approaches

---

Approach A – “Rigid schema” (current, rejected)  
• ✓ Type-safe  
• ✗ Breaks on new/removed fields  
• ✗ Requires continuous migration effort  
• ✗ Loses unrecognised data → no future analysis possible

Approach B – “Raw blob only”  
• ✓ Zero friction / future-proof  
• ✓ Easy diffing  
• ✗ Inefficient queries (client would json.parse + filter)  
• ✗ Hard to index (price, context length, etc.)

Approach C – **Hybrid** (recommended)  
• Store **both**:  
 a. `snapshotBlob: v.bytes()` or `v.object()` with _no_ shape validation  
 b. `projection: v.object({ exact UI fields… })` – tiny, strictly typed  
• Snapshots enable diffing & retro-analysis; projections power fast indexed queries.  
• If the parser extracting the projection fails, we still keep the new snapshot and raise a _non-fatal_ warning.

---

4. Recommended Convex Design

---

4.1 Tables

1. `entitySnapshots`

   - `_id` (Convex)
   - `entityType: "model" | "endpoint" | "provider"`
   - `entityKey: string` // modelKey, provider slug, endpoint id
   - `version: number` // ++ each time we detect change
   - `snapshot: v.bytes()` // gzip-compressed JSON string (≤1 MB)
   - `hash: string` // SHA-256 to fast-compare
   - `_creationTime` (auto) = snapshot timestamp  
     Indexes: `by_entityKey`, `by_hash` (optional for dedup)

2. `entityProjections` (current state)

   - `_id` (Convex)
   - `entityType` / `entityKey` (same as above, both indexed)
   - `version` (mirrors latest snapshot)
   - `data: v.object({ ...UI fields })`
   - Example for endpoint: `{ providerName, modelKey, pricing: { prompt, completion }, contextLength, status, supportsImages, supportsTools, … }`  
     Indexes for common filters: `by_type`, `by_modelKey`, `by_provider`, `by_price_desc`, etc.

3. `endpointStats` (time-series)

   - `_id`
   - `endpointId` (string, indexed)
   - `snapshotTime` (number) // Unix seconds
   - `p50Latency`, `p50Throughput`, `requestCount`, etc.

4. `annotations`
   - `_id`
   - `entityType` / `entityKey`
   - `authorId?`, `tags: v.array(v.string())`, `notes: v.string()`, `scores: v.object({ … })`, etc.

4.2 Sync Jobs (Convex actions)  
• `syncModels`, `syncEndpoints(modelKey)`, `syncProviders`

1.  Fetch frontend API JSON.
2.  `const hash = sha256(JSON.stringify(data))`.
3.  Load last snapshot for entityKey; if hash differs →  
     a. Insert new row in `entitySnapshots`.  
     b. Compute `jsonDiff(prev, data)` (e.g. fast-json-patch) → store diff in same row or separate `entityDiffs`.  
     c. Build `projection = buildProjection(entityType, data)`; upsert into `entityProjections`.  
    • Wrap in crons or interval scheduler (every N minutes/hours).  
    • Never throw on validation error; log and continue.

4.3 Query Patterns  
• Frontend lists use `query.listProjections({ type, paginationOpts, filters })`.  
• Detail page:

- `getProjection(entityKey)` + `getSnapshots(entityKey, limit 10)` + `getStats(endpointId, timeRange)`  
   • Change inspector: compute diff on the fly from stored JSON Patches.

  4.4 Helper Modules  
  • `buildProjection/model.ts` – pick & compute UI fields (e.g., cheapest price, capabilities flags).  
  • `jsonDiff.ts` – wrapper over `rfc6902` or `fast-json-patch`.  
  • Compression util (`deflate` from bun / node) to stay under 1 MB Convex limit.

---

5. Justification

---

• Resilience: we never reject new data – snapshots are opaque blobs.  
• Forward compatibility: when OpenRouter adds new fields we still store them.  
• Query performance: projections are small, indexable and typed.  
• History: snapshot rows + json diff give complete audit without huge storage.  
• Separation of concerns: vendor data, metrics, and our annotations each live in their own tables, avoiding merge conflicts.  
• Simplicity: Convex’s real-time queries power the dashboard with minimal joins (projection already denormalised).  
• Storage cost: compressed blobs + diffing keep total size low; old snapshots can be GC’d after N versions if needed.

---

6. Open Questions & Risks

---

1. **Snapshot Size vs Convex 1 MB limit**  
   • Large provider lists or complex model objects could exceed 1 MB even after compression.  
   • Mitigation: split into multiple documents per logical sub-object, or chunk snapshots.

   - _NOTE: Largest raw response is ~150kb gzipped._

2. **Diff Granularity**  
   • JSON Patch may produce big diffs for array reorder or floating-point noise.  
   • Mitigation: custom normalisation (sort arrays, round floats) before hashing/diffing.

   - _NOTE: No such values observed in the wild._

3. **API Rate Limits & Pagination**  
   • OpenRouter frontend endpoints might paginate or throttle.  
   • Need dynamic back-off and incremental sync.

4. **Entity Deletion Detection**  
   • If an endpoint disappears, we only know when the list API omits it.  
   • Need a “tombstone” sweep job marking missing keys as `status: "deleted"`.

   - _NOTE: Will check this during the sync job._

5. **Metrics Volume**  
   • High-frequency stats could explode storage. Decide on roll-up strategy (hourly p50/p95, daily aggregates).

6. **Hash Collisions / Versioning Race**  
   • Concurrent sync jobs might insert duplicate versions. Use optimistic locking by reading last version inside the mutation.

   - _NOTE: Will enforce sequential syncs._

7. **Projection Evolution**  
   • When the UI needs a new field, we add it to `buildProjection`. Historical projections won’t have it; UI must handle undefined.
