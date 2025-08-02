# Iteration Review

- We've instantiated the prototype versions of the core systems that will be used during a snapshot run's lifetime.
- We've implemented a working demo that snapshots Models and Endpoints data, which is the key information our app uses to provide its current functionality.
- The key evolution from the previous system is the fully embraced dependency injection pattern used by the snapshots processes (FKA. pipelines) 
- We can also "replay" snapshots from archives
- The system exists in parallel to v1, and currently borrows some of its supporting systems.
- Stats/uptime denormalised field support is postponed.

## Major Changes

- `snapshot_at` is no longer updated on stable entities
- Entity diffing is performed in the process action, rather than per output mutation
- `upsert` functions are no longer used

## Next

- Refine each of elements we have created.
- DI element normalisation
- Validation/Output/Metrics rework

## Out of Scope

- Scheduler, Orchestrator, Process-Engine, Derived Projections, Test Harness, Archive Compaction, Admin UI
