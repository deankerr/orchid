# issues

- we've never actually built the "rebuild from archives" functionality we claim to have
- our process is heavily coupled, which makes sense for the first-time run to gather all available data at once, but can enable flexibility after
- our reactive UI can thrash with bulk updates to entire categories like "models"
- it's not currently testable/configurable/flexible
- changes are the wrong approach - we should track changes on the raw API responses, not our derived entities
- validation is overly complex - strict validation is not needed when raw changes can be interpreted
- the `snapshot_at` concept isn't necessary or ideal, we can render the data we have available, noting it as outdated based on context if needed
- time series related data structure still isn't right - balance between historical/current data
- no granularity of control over how often parts of the system can run - e.g. token stats, apps data doesn't need to be fetched every hour
- our archival storage growth is currently unbounded (but manageable)

# ideas

- we've been taking incremental steps towards improving these issues, but we should perform a full evolution of the system to properly integrate these aspects

- Snapshot Process DI:
  - we've approached this with the "sources" concept - we pass in the methods to get required data. currently its just the regular api call, but this can be swapped out for archived data or testing data
  - our "context" object should be passed in instead of the convex one, containing the output methods we inject based on the scenario
  - main process shouldn't have to managing archive action - injected, based on process configuration (by default any api call should automatically save the result, but can be disabled)

- Granularity: 
  - a process shouldn't necessarily be updating every possible element at once - we may want to target only specifics
  - e.g. it should be possible to say "update THIS model only" or "update THIS endpoint uptime data only"

- Retrival/Archives
  - using file storage for raw results is a good idea, but not being utilized
  - "source adapters" should abstract the origin of the data
  - remote fetches should integrate archival - caller providers e.g. run id

- Decoupled Input -> Process
  - consider an input system agnostic of data processing, it just saves to file, with returned data potentitally being used to query more data
  - data processing assumes it is only processing from archival data

- Output
  - we pass in a function for storing data to db - could actually be test result

- Errors/Validation
  - remove strict validation, but we still need to validate our db values
  - validation issues could be a type of result passed to output, with the caller diverting them to a report
  - improved contextual data on why this item was being processed (e.g. model slug)

- Validation/Transform
  - this is the crux of what the data processing step is actually doing, schema definition should be completely integrated with transform

- Thashing
  - Replacing `snapshot_at` with a more standard `updated_at` field will prevent needless updates for the majority of entities which don't change every hour
  - Store stats seperetely from the model/endpoint entities (?)

- Cleanup/Compact Tasks
  - Actually do these
  - This could allow a "save first, clean up later" approach

# additional design goals/notes

- modular, composible processing, focusing on working on a "per model" basis, rather than "per entity"
  - models/endpoints should be a single process, giving us more flexibility in how to divide data/responsibility between them
- we can add tables and/or make minor alterations 
- add DSL style workflow definitions - prefer functional methods, be they definitions or arrays of functions, etc.
  - configurability can include adding/modifying these structures, then choosing/switching between them

# open questions

- should we have the ability to read the current state of our OR view and perform queries/operations based on it?
- should be maintain a separate "manifest" of key data (e.g. slugs, model names, variants, updated at etc.)
- would this concept be useful in the front end as well?
- observability of processes should feel more inbuilt
- less managing output parts manually (entities, issues, etc.)

# deferred

- major schema changes to our db or entities. we should keep this stable during the refactor to enable practical and natural verification
