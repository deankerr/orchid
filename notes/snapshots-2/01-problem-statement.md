# ORCHID Snapshot & Processing System: Consolidated Problem Statement

## 1. Architecture & Coupling

- Core pipeline tightly binds data fetching, transformation, validation, archival, and database upserts into single flows.
- Difficulty swapping data sources (live API vs. archived data vs. test fixtures) without code changes.
- Limited dependency injection – context objects, output handlers, and source adapters are interwoven rather than pluggable.

## 2. Snapshot Scheduling & Granularity

- Hourly cron schedule treats every pipeline as equally urgent regardless of data volatility.
- Inability to trigger subset updates (e.g., refresh one model or only uptime stats) without running the full orchestrator.
- No per-pipeline cadence configuration; token stats and app leaderboards fetch more frequently than necessary.

## 3. Data Validation & Error Handling

- Strict validation schemas enforce completeness even when upstream APIs evolve unexpectedly.
- Validation failures halt or clutter runs, yet the raw data is still useful if partially valid.
- Error reporting aggregates into large issue blobs with minimal contextual metadata for troubleshooting.

## 4. Storage, Archival & Rebuild Strategy

- Archive size grows without bounds; no pruning, compression strategy evaluation, or tiered retention policy.
- “Rebuild from archives” capability is unimplemented, leaving derived data as de-facto source of truth.
- Archival write path embedded in pipelines; cannot be toggled or redirected easily for testing.

## 5. Database Schema & Derived State

- Entities include `snapshot_at` to denote freshness, yet UI logic still compares current time to infer staleness.
- Rolling metrics (72 h latency, 30 d averages) calculated during upsert, mixing historical and derived data concerns.
- Change-tracking tables proliferate (`*_changes`) but are under-indexed and lack consumption strategy.

## 6. Performance & UI Reactivity

- Bulk upserts trigger large numbers of Convex patches, causing flicker or thrash in live dashboards.
- Data that rarely changes (providers, authors) refreshes as often as high-churn data (endpoints), wasting compute.

## 7. Testing, Observability & Diagnosability

- End-to-end runs cannot be executed against deterministic fixtures without network access.
- Metrics on pipeline duration, entity counts, and validation issues are buried inside snapshot run documents and not surfaced.
- Lack of fine-grained logs or tracing makes root-cause analysis of failures slow.

## 8. Code Maintainability & Modularity

- Shared helper utilities (`fnHelperLite`, `table3`) show promise but are inconsistently applied.
- Repetitive diff-/upsert-/change-record patterns across entity modules lead to copy-paste complexity.
- Business rules (e.g., staleness thresholds) hard-coded in queries rather than configurable.

## 9. Scalability & Future Growth

- Up-front assumption that snapshot data volume remains “moderate” may not hold with provider expansion.
- Rolling windows (72 h / 30 d) implemented via in-document arrays could hit Convex document size limits.

## 10. Open Questions & Ambiguities

- Should the system reference existing database state during processing, or treat each run as purely append-only?
- Is a separate “manifest” of key identifiers beneficial for both backend processing and frontend queries?
- How should historical data vs. current-state projections be partitioned to balance query speed and storage?
