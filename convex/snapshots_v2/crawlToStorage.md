Read file: convex/snapshots_v2/sources/endpoints.ts

Here’s what I’d do if we lean-in to the “capture everything first, worry about transforms later” philosophy you’re describing.

---

1. Collecting data

---

• Stop validating anything except the keys you genuinely need for the **next hop** in the pipeline (today:  
  • model.permaslug   • model.variant   • endpoint.uuid).  
  Every other field can stay as «unknown».

• Flatten the fetch layer. One helper per OpenRouter endpoint is enough:

```ts
// convex/openrouter/raw.ts
export const fetchRaw = {
  models: () => orFetch('/api/frontend/models'),
  endpoints: (p, v) =>
    orFetch('/api/frontend/stats/endpoint', { params: { permaslug: p, variant: v } }),
  uptimes: (uuid) => orFetch('/api/frontend/stats/uptime-hourly', { params: { id: uuid } }),
  apps: (p, v) =>
    orFetch('/api/frontend/stats/app', { params: { permaslug: p, variant: v, limit: 20 } }),
}
```

No Zod here – failure == network or JSON parse error only.

---

2. Storing raw snapshots

---

I’d pivot to a single **RawArchive** table per run:

```ts
raw_snapshot_archives: {
  _id
  run_id
  snapshot_at // hour aligned
  path // "/api/frontend/models" etc
  key // optional discriminator e.g. "claude-3-5:standard"
  storage_id // gzip blob in Convex storage
  size // original bytes for quick cost calc
}
```

• Each fetch is written immediately; no buffering required.  
• Compression (gzipSync) happens client-side exactly like you already do in `archive.ts`.  
• We never write the remote payload into typed DB tables – we rely on the blob for ground-truth.

Benefits:

1. Keeps DB tiny (only pointers + metadata).
2. Lets us replay any run end-to-end without hitting network.
3. We can GC/compact blobs later by cron (e.g. keep every hour for 24h, then every 6h for a week, …).

---

3. Process orchestration

---

The entire “engine + inputs + outputs + process” stack can collapse into one action that:

1. Fetches `/models` → writes archive rows.
2. For each (permaslug, variant) fetches `/endpoints` and `/apps` (if desired) → writes.
3. For each endpoint uuid fetches `/uptime-hourly` → writes.
4. Records a `snapshot_runs` row with timing + status.

That’s ~60 lines of code; no exotic abstractions needed. You already have most of it – you can strip out:
• `makeInput`, `InputSpec`, Zod transforms, metrics collector, etc.  
The _decision_ logic (insert/update/stable) then runs later, during **materialisation**.

---

4. Derived state generation

---

Because raw archives are immutable, we can rebuild any projection at will:

• A Convex _action_ `materialiseSnapshot(runId)` streams blobs, decodes, and emits to typed tables (`or_models`, `or_endpoints`, …) with whatever validation we feel like **today**.  
• If requirements change we just delete the derived tables and re-materialise.

This split cleanly separates concerns:
– “garbage truck” raw ingestion (no schema).  
 – “factory” materialisation (schema, metrics, denormalisation).

---

5. Validation strategy

---

• During materialisation run Zod-heavy transforms.  
• Collect issues per entity and store them in a lightweight `snapshot_validation_issues` table so they don’t pollute the ingest path.  
• Surfacing a % of invalid docs per run becomes trivial analytics.

---

6. Compaction / retention

---

• Daily cron: walk `raw_snapshot_archives` → if blob older than X & not referenced by any “retained” snapshot run, delete storage + row.  
• Extra credit: produce a weekly TAR of oldest blobs, upload to cold storage, keep just the manifest in Convex.

---

7. Why this plays nicely with Convex

---

• Blob storage is optimised for read-mostly workloads and large objects – we may as well use it.  
• Actions have no DB access, mutations do – so:  
  – Ingest path = **internalAction** (network + storage).  
  – Materialise path = **internalAction** + internalMutations for writing to tables.  
• No ETL step ever touches untrusted data inside a transaction, eliminating contention.

---

8. Incremental roadmap

---

Phase 0 (1–2 hrs)
• delete `inputs.ts`, `outputs/`, `standard_v2.ts` etc.  
 • new `convex/snapshots_v2/fetchAndArchive.ts` single-file action with logic above.

Phase 1
• create new `materialise.ts` that converts one run into typed tables using _decision_ diff.

Phase 2
• hook both into cron scheduling.  
 • add retention/compaction cron.

Phase 3
• extend materialiser to additional entities (apps, provider root data).  
 • bolt-on metrics & change detection dashboards.

---

## My take

Simplifying the ingest path to “fetch → gzip → store blob” aligns with your “remote-only, minimum validation” goal and keeps long-term flexibility. Materialisation becomes a pure, stateless transform that can iterate fast without touching network or worrying about rate-limits. The current multi-file architecture served its purpose while the ideas were fuzzy, but now that the direction is clear it’s safe (and healthy) to delete ~70 % of it.

Let me know if you want a concrete code sketch or have concerns about blob costs / cron overhead.
