# 07 – Minimum-Crawler Architecture (2025-07)

## 1  Why the shift?

Our earlier v2 refactor tried to be **too clever**:
• heavy Zod validation at ingest time
• multi-layer `inputs / outputs / processes`
• snapshot‐run records and metric collectors

Useful experiments, but they obscured a simpler truth:
> We just need the raw OpenRouter responses, hour aligned, forever.

Everything else (validation, denormalisation, metrics, dashboards) can be **derived later**.  This leads to a minimal and far more robust ingestion system.

## 2  What the new system looks like

### 2.1  Data model

| table | purpose |
| --- | --- |
| `snapshot_crawl_config` | **single row** with hour-modulo schedule (+ delay / jitter) |
| `snapshot_raw_archives` | one row per `<runId, path>` pointing at the gzipped blob in Convex storage |

No more `snapshot_runs`, `snapshot_archives`, or status tables – Axiom log search is good enough for ops.

### 2.2  Crawler flow

1. **Cron** fires hourly → reads `crawl_config` → decides which components to fetch by simple `hour % interval === 0` rules.
2. Schedules `snapshots_v2/crawlToStorage.run` with boolean flags.
3. `crawlToStorage` fetches the requested endpoints and writes each gzip blob ⇢ `snapshot_raw_archives`.
4. Done (< 500 ms network + storage per component).

### 2.3  Key files added / updated

```
convex/db/snapshot/crawlConfig.ts      // new config table
convex/db/snapshot/rawArchives.ts      // renamed / kept, acts as index
convex/snapshots_v2/crawlToStorage.ts  // action that does the network I/O
convex/crons.ts                        // modulo scheduling logic
convex/schema.ts                       // table wired-in
```

### 2.4  Operational characteristics

• **Idempotent & stateless** – nothing depends on previous runs.
• **Storage-cheap** – gzip + Convex blob dedup handles size; we compact blobs later.
• **No locking** – multiple crawls can overlap; worst case is duplicate blobs.
• **10-minute action limit** – safe: network fan-out is modest (<10 kB responses each).

## 3  Next steps

1. **Insert initial `crawl_config` row**
   ```ts
   db.insert('snapshot_crawl_config', {
     enabled: true,
     core_every_hours: 1,
     authors_every_hours: 24,
     apps_every_hours: 24,
     uptimes_every_hours: 6,
     delay_minutes: 5,
     jitter_minutes: 10,
   })
   ```
2. **Materialiser** – separate action/cron that reads blobs for a run and emits typed tables (`or_models`, `or_endpoints`, …) with full validation.
3. **Retention cron** – periodically delete blobs older than N days **unless** the runId is tagged for long-term retention.
4. **UI integration** – simple list of recent `runId`s with counts (derived from index rows).
5. **Kill legacy code** – delete `inputs.ts`, `engine.ts`, `standard_v2.ts`, and friends once the materialiser is live.

## 4  Open questions

• What retention policy balances cost vs. historical analysis?
• How do we version transformations so the materialiser can be re-run after schema changes?
• Do we want a second “daily full” crawl that also fetches `/stats/endpoint?permaslug=*` without variant filtering for completeness?

---
*Authored automatically by the Cursor refactor assistant.*
