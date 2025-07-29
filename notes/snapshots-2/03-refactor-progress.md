**This is the master document and source of truth for design decisions made that differ from the proposals.**

- "standard" model/endpoints process
- `processContext`
  - `sources` - integrated archival
  - `validator` - collects failed zod safe parse results, embedded in `sources`
  - `outputs` - flexible, combined entity output types.
    - still using previous db upsert methods/endpoints
    - skip metrics collection for now
