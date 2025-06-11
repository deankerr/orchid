# sync_v1

## OpenRouter entities

### Model

- Fetched from the models endpoint, discovers each model and its variants available
- Primary key is slug, permaslug + variant will have different endpoints per variant
- Permaslug may be a versioned slug for models which have updates/revisions
  - eg. slug: 'openai/gpt-4o' -> permaslug: 'openai/gpt-4o-2024-04-05'
  - In practice this is rare
- The base model data is the same per variant, but endpoint returns a distinct "model" entity for each
- We save dealing with an extra ~120 duplicate models by consolidating them
- Contains mainly descriptive data about a model, with some data merged into our endpoint representation
  for more efficient querying in the Convex backend model

### Sync

- In production, a sync will be triggered by a cron, currently planned to be hourly.
- An epoch is a timestamp that has been aligned to a standard timestamp, linking each entity's current snapshot time
  - We align these to the start of the hour, but they technically can be anything
- Models, Endpoints, Authors, Apps and Providers (TBC) have an `epoch` field, representing the last snapshot epoch it was found and updated at.
  - An `epoch` value that lags behind the majority indicates an entity that no longer appears in the API results, and was likely hidden/deleted by OpenRouter
  - We also store a JSON diff for these entities in order to track updates made to them, eg. pricing changes
    - Currently just storing them in raw form
  - Endpoint Stats is separated from Endpoints as it changes frequently, and doesn't need a diff
- We also have Uptime, Model Tokens and App Tokens timeseries data, which is returned from the API with a timestamp aligned to an hour/day, with the most recent n entries
  - This is stored by that timestamp rather than an epoch, and we store any that we don't have an keep up to date with changes.
