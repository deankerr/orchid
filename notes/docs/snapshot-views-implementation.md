# Snapshot/Views Implementation Guide

## System Architecture

### Core Process Flow

The ORCHID snapshot system operates as an hourly batch process that:

1. **Cron triggers** the snapshot process at each hour boundary
2. **Phase 1** fetches independent entities (Providers, Models) in parallel
3. **Phase 2** fetches dependent entities (Endpoints, Apps, Authors) in parallel
4. **Each entity** stores its own snapshot file during fetching
5. **Validation** occurs immediately after each API response
6. **Merge operations** update view tables with validated data
7. **Report generation** summarizes the entire run

### Granular Snapshot Storage

ORCHID stores individual API responses as separate files, not a monolithic snapshot:

```
Snapshot file patterns:
- openrouter-models-snapshot-{timestamp}
- openrouter-providers-snapshot-{timestamp}
- openrouter-endpoints-{model}-{variant}-snapshot-{timestamp}
- openrouter-apps-{model}-{variant}-snapshot-{timestamp}
- openrouter-author-{slug}-snapshot-{timestamp}
```

Each snapshot file contains:
- Raw API response data
- Stored during the sync process (not at the end)
- Compressed with gzip
- Immutable once written

### Entity Processing Pattern

Each entity follows a consistent pattern:

1. **Fetch data** from specific OpenRouter API endpoint
2. **Store snapshot** immediately with descriptive key
3. **Validate** using dual schemas (transform + strict)
4. **Transform** data into view-ready format
5. **Track issues** with specific identifiers
6. **Return** processed data and validation issues

Example from endpoints processing:
```
For each model variant:
  → Fetch from /api/frontend/stats/endpoint
  → Store: openrouter-endpoints-{model}-{variant}-snapshot-{timestamp}
  → Validate response
  → Transform into EndpointView objects
  → Track any validation issues
  → Also fetch uptime data for each endpoint
```

### Phase Organization

#### Phase 1: Independent Entities

**Models** (`syncModels`):
- Fetches from `/api/frontend/models`
- Consolidates variants (groups by slug)
- Returns model views with variant arrays

**Providers** (`syncProviders`):
- Fetches from `/api/frontend/all-providers`
- Simple transformation to provider views

#### Phase 2: Dependent Entities

**Endpoints** (`syncEndpoints`):
- Requires model data to construct requests
- Fetches endpoint stats for each model variant
- Also fetches uptime data for each endpoint
- Returns endpoints, stats, and uptime data

**Apps** (`syncApps`):
- Requires model data
- Fetches app usage for each model variant
- Returns apps and app token statistics

**Authors** (`syncAuthors`):
- Requires author slugs extracted from models
- Fetches author details and token stats
- Returns authors and model token statistics

### Batch Processing

Large datasets are processed in batches to avoid Convex limits:

```
Batch sizes:
- App tokens: 2,000 items per batch
- Model token stats: 5,000 items per batch  
- Endpoint uptimes: 5,000 items per batch
```

The `processBatchMutation` utility:
- Splits large arrays into chunks
- Calls mutation multiple times
- Aggregates results
- Prevents timeout errors

### Dual Validation Strategy

Every API response undergoes two validations:

1. **Transform Schema**:
   - Extracts only needed fields
   - Shapes data for our use
   - Allows unknown fields
   - Critical for operation

2. **Strict Schema**:
   - Validates complete structure
   - Fails on unknown fields
   - Detects API changes
   - Informational only

Validation results in issues tracked as:
```typescript
{
  type: 'transform' | 'schema' | 'sync',
  identifier: string, // e.g., "gpt-4-default:0"
  message: string
}
```

### Merge Operations

Each entity type has a merge function that:

1. **Checks existence** using unique identifier
2. **Compares data** if entity exists
3. **Inserts or updates** as needed
4. **Returns MergeResult**:
   - `insert`: New entity added
   - `replace`: Existing entity updated
   - `stable`: No changes detected

### Error Handling Patterns

The system handles failures gracefully at multiple levels:

**Phase Level**:
- If Phase 1 fails (no models), Phase 2 is skipped
- Partial data is better than no data

**Entity Level**:
- Individual API failures don't stop other entities
- Each sync function catches and reports errors

**Validation Level**:
- Transform failures skip that item
- Strict failures are logged but don't stop processing

**Batch Level**:
- Large datasets split to avoid timeouts
- Individual batch failures isolated

### File Storage Details

The `files_v2` table tracks all snapshots:
```
- key: Unique identifier for retrieval
- epoch: Hour-aligned timestamp
- storage_id: Convex blob reference
- size_original: Size before compression
- size_stored: Size after compression
- sha256: Content hash
- compression: "gzip" or undefined
```

Storage operations:
- `storeJSON`: Converts to JSON, optionally compresses, stores blob
- `retrieveJSONByKey`: Retrieves, decompresses if needed, parses JSON

### Summary Report

After all phases complete, a summary report is generated containing:
- Processing metadata (duration, epoch)
- Entity counts and merge results
- All validation issues encountered
- Success/failure statistics

This report provides a high-level view of the entire run.

## Operational Patterns

### Adding a New Entity Type

1. **Determine dependencies**: Which phase should it run in?
2. **Create sync function**: Follow the standard pattern
3. **Define schemas**: Both transform and strict
4. **Add to phase**: Include in parallel execution
5. **Create merge function**: Handle view table updates
6. **Update report**: Include in summary generation

### Debugging Failed Syncs

1. **Check individual snapshots**: Each API call has its own file
2. **Review validation issues**: Transform vs strict failures
3. **Examine merge results**: What changed or failed?
4. **Look for patterns**: Same model failing repeatedly?

### Performance Considerations

- **Parallel execution**: Maximize within each phase
- **Batch sizing**: Balance between speed and limits
- **Compression**: Reduces storage and transfer costs
- **Selective reprocessing**: Can rerun specific entities

## Best Practices

1. **Snapshot naming**: Use descriptive, parseable keys
2. **Issue tracking**: Include specific identifiers
3. **Batch sizing**: Test limits, leave headroom
4. **Error messages**: Make them actionable
5. **Validation balance**: Transform minimal, strict complete
6. **Dependencies**: Respect natural data relationships

## Summary

The ORCHID snapshot/views system is a sophisticated data pipeline that balances reliability, performance, and flexibility. By organizing collection into dependency-aware phases, validating data comprehensively, and storing complete reports, the system provides a robust foundation for tracking the evolving AI model ecosystem. 