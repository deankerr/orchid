# OpenRouter Data Snapshots

## Overview

This document describes our approach to crawling and preserving raw data from OpenRouter's APIs. The goal is to capture comprehensive information about AI models, their endpoints, and providers in a way that preserves the original data while enabling efficient storage and future analysis.

## What We're Trying to Accomplish

OpenRouter provides access to hundreds of AI models across dozens of providers. Our objective is to:

- Capture complete snapshots of the OpenRouter ecosystem at regular intervals (hourly)
- Preserve all raw data exactly as received from their APIs
- Track changes over time - models appearing, disappearing, and reappearing
- Build a foundation for analyzing model availability, pricing changes, and performance metrics
- Create a reliable historical record that can answer questions we haven't thought of yet

The key principle is preservation first - we store everything in its raw form before attempting any transformation or analysis.

## Challenges We Face

### Data Volume and Redundancy

The OpenRouter APIs return massive amounts of redundant data. Model information is embedded within endpoint data, provider information is duplicated across endpoints, and the same data structures appear hundreds of times. A single sync can pull over 5MB of raw data, though compression reduces this dramatically (to ~700KB).

The model-author endpoint is particularly problematic - beyond basic author information, it returns every model with approximately one month of token usage data in verbose format. Each endpoint contains another complete model definition embedded within it. For prolific authors like meta-llama with many models, this creates exponential duplication. Combined with validation processes that create copies in memory, a single action can easily consume 64MB. OpenRouter appears unconcerned with data transfer or memory efficiency, blasting this data at users as they navigate the website.

### Entity Identification and Linking

Models and endpoints use different identifiers across different API endpoints:

- Models have slugs, permaslugs, IDs with variants
- Endpoints have UUIDs that must be discovered through specific API calls
- The same model might be referenced differently depending on context
- Some identifiers include variant information, others don't

Orphaned models (those with no available endpoints) present additional identification challenges. Since they have no endpoints to query, determining their canonical identifier becomes less straightforward and must be inferred from other fields like name. These models represent historical records of models that are no longer available - useful for tracking when known models disappear from the ecosystem.

### Disappearing and Reappearing Resources

Models and endpoints frequently disappear from the API responses - sometimes permanently, sometimes temporarily. We need to distinguish between:

- Models that have been discontinued
- Temporary unavailability
- "Orphaned" models (models that exist in listings but have no available endpoints)

There's a quirk in OpenRouter's API where orphaned models don't appear in the `/api/v1/models` endpoint but do appear in `/api/frontend/models`.

### API Structure Complexity

The OpenRouter API structure requires sequential discovery:

1. Get list of models to find identifiers
2. Use those identifiers to query for endpoints
3. Use endpoint IDs to query for metrics
4. Each level reveals new identifiers needed for the next

The duplication in responses is extensive - models contain embedded endpoints, endpoints contain embedded models plus provider information, creating deeply nested redundant structures.

### Rate Limits and Performance

While not explicitly documented, we must be mindful of:

- API rate limits that could interrupt large syncs
- Memory constraints when processing large responses (especially model-author endpoints)
- Time efficiency (current implementation takes ~6 minutes per sync)

## How the Current Implementation Works

### Batch-Based Snapshots with Hourly Alignment

Rather than tracking individual entities, we organize data collection into batches identified by a timestamp rounded to the start of the hour. This approach makes the snapshot timing independent of when the sync actually started and creates uniform timestamps that make working with multiple hours of data much easier. Each hourly snapshot shares a common `batchTimestamp` that links all related data collected during that sync operation.

### Single Compressed Blob Storage

To maximize compression efficiency, we currently aggregate all model and endpoint data into a single large data structure before compression. This approach leverages the redundancy in the data - repeated keys and structures compress extremely well, achieving compression ratios of nearly 10:1. The decision was driven by simplicity and the fact that we typically only need to read the entire snapshot once to create projections.

### Discovery Process

The sync process follows the API's natural hierarchy:

1. Fetch the authoritative list of model identifiers
2. Fetch detailed model information
3. For each model, discover its endpoints across providers
4. Collect performance metrics for each endpoint
5. Identify "orphaned" models that have no endpoints

We use validation schemas to strip out duplicated embedded data during the fetch process, though this creates additional memory pressure as validation processes create copies of the data structures.

### Raw Data Preservation

All data is stored exactly as received from the API, compressed but otherwise unmodified. This ensures we can always go back to the source data for new analysis or to handle schema changes.

## Where the Current Implementation is Lacking

### Incomplete API Coverage

We're not yet capturing:

- Provider-level data (policies, capabilities, regional information)
- Model author information (avoided due to extreme memory and duplication issues)
- Time-series metrics that require separate API calls per endpoint

### Manual Triggering

Snapshots are currently triggered manually rather than running automatically on the planned hourly cron schedule.

### Limited Query Capabilities

While we can retrieve and decompress full snapshots, we lack:

- Efficient ways to query for specific entities within a snapshot
- Cross-snapshot comparison without loading multiple large blobs
- Indexing of key fields for quick lookups

### No Differential Storage

Each snapshot stores complete data, even if 99% hasn't changed from the previous hour. This works for now but may become inefficient over longer time periods.

### Missing Validation

We don't currently validate that all expected data was successfully captured or that entity relationships are consistent within a snapshot.

### Single Blob Limitations

The current approach of storing everything in one compressed blob was chosen for simplicity and compression efficiency, but it limits our ability to efficiently query subsets of data or track changes at a granular level. This design will need to evolve as requirements become more sophisticated.

## Data Characteristics

Based on initial observations:

- A full sync captures data for ~2000 models and their endpoints
- Raw data size: ~5.4MB per snapshot
- Compressed size: ~680KB per snapshot
- Sync duration: ~6 minutes
- Orphaned models: Typically a small percentage, representing discontinued or temporarily unavailable models

## Future Considerations

The snapshot system provides a foundation for:

- Building efficient projections for specific use cases
- Tracking historical trends and changes
- Detecting patterns in model availability
- Analyzing provider behavior and reliability

The key is that by preserving raw data first, we maintain flexibility to adapt our analysis as requirements evolve. However, the current single-blob approach will likely need to be refactored to support more sophisticated querying and analysis patterns.
