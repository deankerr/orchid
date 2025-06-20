# ORCHID Snapshot/Views System Overview

## Introduction

ORCHID employs a sophisticated data synchronization and processing system that captures OpenRouter's API data through periodic snapshots, validates and transforms it, then projects it into queryable views. This document explains how the system actually works.

## Architecture Overview

### The Snapshot Process

ORCHID's snapshot system orchestrates intelligent data collection that:

1. **Fetches data in dependency-aware phases**
2. **Stores granular snapshots of each API response**
3. **Validates and transforms data during collection**
4. **Generates a comprehensive report of the entire run**
5. **Merges validated data into view tables**

The snapshot process runs periodically (aligned to hour boundaries) and captures the complete OpenRouter ecosystem state at that moment.

### Multi-Phase Data Collection

The snapshot process runs in carefully orchestrated phases to respect data dependencies:

**Phase 1 (Parallel):**
- **Providers**: Infrastructure providers hosting the models
- **Models**: All available AI models

**Phase 2 (Parallel, depends on Phase 1):**
- **Endpoints**: Provider-specific model endpoints (needs model data)
- **Apps**: Applications using the models (needs model data)  
- **Authors**: Model creators/organizations (derived from model author slugs)

This phased approach ensures data consistency and allows for efficient parallel fetching where dependencies permit.

### Granular Snapshot Storage

Unlike traditional monolithic snapshots, ORCHID stores individual API responses as separate compressed files:

```
Examples:
openrouter-models-snapshot-1704067200000
openrouter-providers-snapshot-1704067200000
openrouter-endpoints-gpt-4-default-snapshot-1704067200000
openrouter-apps-gpt-4-default-snapshot-1704067200000
openrouter-author-openai-snapshot-1704067200000
```

This granular approach provides:
- Precise debugging capabilities
- Ability to reprocess specific entities
- Efficient storage through targeted compression
- Clear audit trail per API call

### Data Flow

```
OpenRouter APIs
    ↓
Snapshot Process (hourly)
    ├── Phase 1: Providers + Models (parallel)
    │   ├── Store individual snapshots
    │   └── Validate & transform data
    └── Phase 2: Endpoints + Apps + Authors (parallel)
        ├── Store individual snapshots per model/variant
        └── Validate & transform data
            ↓
        Merge into View Tables
            ↓
        Generate Summary Report
```

## Key Components

### 1. Epoch Alignment

Epochs are timestamps aligned to the start of each hour:
```typescript
// Epoch for 3:45 PM becomes 3:00 PM
const epoch = getEpoch(Date.now())
```

This ensures consistent temporal boundaries across all data types.

### 2. Dual Validation Strategy

ORCHID uses two schemas for each entity type:

- **Transform Schema**: Extracts and shapes the data we need
- **Strict Schema**: Validates our complete understanding of the API structure

This approach allows the system to:
- Continue operating even when APIs add new fields
- Detect when our understanding of the API is incomplete
- Separate data extraction from structural validation

### 3. Granular Entity Processing

Each entity type has its own sync function that:
- Fetches data from specific API endpoints
- Stores raw response as a snapshot file
- Validates using dual schemas
- Returns processed data and validation issues
- Tracks issues with specific identifiers

For example, when syncing endpoints:
- Fetch endpoint data for each model variant
- Store snapshot: `openrouter-endpoints-{model}-{variant}-snapshot-{timestamp}`
- Validate and transform the response
- Additionally fetch uptime data for each endpoint
- Return endpoints, stats, uptimes, and any issues

### 4. Batch Processing

For large datasets, the system uses batch processing to avoid Convex limits:
- App tokens: 2,000 items per batch
- Model token stats: 5,000 items per batch
- Endpoint uptimes: 5,000 items per batch

This ensures reliable processing even with large volumes of data.

### 5. File Storage System

The sophisticated file storage system provides:
- Files stored in Convex's blob storage
- Metadata tracked in `files_v2` table
- Automatic gzip compression
- Content-addressed with SHA256 hashes
- Retrieved by unique keys

### 6. View Tables and Merge Operations

Views are populated through merge operations that:
- Take validated entity data
- Check if entity already exists
- Insert new or update existing records
- Track changes with `MergeResult` types
- Return action taken (insert/replace/stable)

## Design Philosophy

### 1. Dependency-Aware Processing

The phased approach respects natural data dependencies:
- Models must be fetched before endpoints (URLs constructed from model IDs)
- Author slugs are extracted from models before fetching author details
- Each phase can run its operations in parallel

### 2. Granular Storage

Each API response gets its own snapshot file because:
- Different endpoints have different data volumes
- Debugging is easier with targeted snapshots
- Reprocessing can be selective
- Storage is more efficient

### 3. Graceful Degradation

The system handles failures at multiple levels:
- Phase failures: If models fail, Phase 2 is skipped
- Entity failures: Individual API calls can fail without stopping others
- Validation failures: Issues are logged but processing continues
- Batch failures: Large datasets are processed in chunks

### 4. Complete Observability

Every aspect of the process is observable:
- Individual snapshot files show exact API responses
- Validation issues include specific identifiers
- Merge results track what changed
- Summary report provides overview

## Benefits

### 1. Reliability
- Phased processing reduces cascading failures
- Batch processing handles large datasets
- Validation issues don't stop data collection
- Individual failures are isolated

### 2. Debuggability
- Granular snapshots enable precise investigation
- Issue identifiers pinpoint exact problems
- Raw API responses always available
- Clear audit trail per entity

### 3. Performance
- Parallel fetching within phases
- Batch processing for large arrays
- Compressed storage reduces I/O
- Targeted reprocessing possible

### 4. Flexibility
- New entity types easily added
- Validation schemas can evolve
- Individual entities can be reprocessed
- Storage patterns are consistent

## Example: Processing a Model Update

1. **Hour boundary reached** (e.g., 3:00 PM)
2. **Snapshot process triggered** with epoch 1704067200000
3. **Phase 1 executes**: 
   - Fetch models from `/api/frontend/models`
   - Store snapshot: `openrouter-models-snapshot-1704067200000`
   - Validate and consolidate variants
4. **Phase 2 executes**: For each model variant:
   - Fetch endpoints, store snapshot per model/variant
   - Fetch apps, store snapshot per model/variant
   - Extract author slugs, fetch author data
5. **Merge operations**: 
   - Each entity type merged into its view table
   - Changes tracked with MergeResult
6. **Report generated**: Summary of entire run
7. **Frontend queries**: Use view tables for fast access

## Summary

ORCHID's snapshot system is a sophisticated orchestration system that balances granularity with efficiency. By storing individual API responses as separate snapshots, validating aggressively, and processing in dependency-aware phases, the system provides exceptional debuggability and reliability while maintaining the flexibility to evolve with changing APIs. 