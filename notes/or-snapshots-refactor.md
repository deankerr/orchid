# OpenRouter Snapshots Refactor

## Overview

This document tracks the refactor of our OpenRouter snapshot system from a single compressed blob approach to a granular, uncompressed storage system that prioritizes data preservation and schema flexibility.

## Core Principles

1. **Preservation First**: Store every API response in full (minus unnecessary embedded entities) to handle schema changes gracefully
2. **Schema Agnostic**: The system must continue functioning regardless of OpenRouter API changes
3. **Historical Reconstruction**: We must be able to recreate projection states at any point in time from our snapshot archive
4. **Production Ready**: Launch ASAP to start collecting data while we develop the rest of the system
5. **Radical Simplicity**: Store first, ask questions later - complexity comes in later phases

## Terminology

To avoid confusion with OpenRouter's multiple identifier fields, we establish our own clear terms:

### Our Terms

- **`modelKey`**: Our definitive model identifier - corresponds to OpenRouter's `model.id` from `/api/v1/models`

  - Examples: `openai/gpt-4.1`, `anthropic/claude-3-sonnet:beta`, `meta-llama/llama-3.1-8b-instruct:free`
  - This is what users see in URLs and use for inference requests
  - Includes variant information (`:free`, `:beta`, etc.) when applicable

- **`endpointId`**: OpenRouter's endpoint UUID - corresponds to `endpoint.id`

  - Examples: `25b2cca5-53f6-40e7-b47b-191ec968b7c2`

- **`syncTimestamp`**: Hour-aligned timestamp linking all data from the same sync operation

### OpenRouter's Confusing Terms (for reference only)

- `slug`: Shared across variants, not unique
- `permaslug`: Version-specific, required for some API calls
- `model_variant_slug`: Same as our `modelKey`
- `model_variant_permaslug`: Opaque value for API queries only

We use our own terms consistently throughout the system to eliminate confusion.

## Refactor Goals

### Phase 1: Production Launch (Immediate Priority)

- **Goal**: Get snapshot collection running in production ASAP
- **Storage**: Uncompressed individual entity storage for easier development
- **Scope**: Models and endpoints only (providers and model-authors deferred)
- **Scheduling**: Automated hourly cron jobs
- **Schema**: New granular storage schema

### Phase 2: Enhanced Projections (Next)

- **Goal**: Improve projection system with change detection
- **Features**: Track what changed between snapshots
- **Efficiency**: Only recompute projections for changed entities
- **Validation**: Ensure projection consistency and completeness

### Phase 3: Data Management (Later)

- **Goal**: Handle long-term storage growth
- **Features**: Compression and archival of older snapshots
- **Rollup**: Aggregate historical data for analysis
- **Cleanup**: Automated retention policies

## New Schema Design

### Core Tables

#### `snapshots` (Universal Storage)

```typescript
{
  category: string // "model" | "endpoint" | "provider" | "author" | "sync_log" | etc.
  key: string // modelKey, endpointId, providerSlug, syncTimestamp, etc.
  epoch: number // Rounded to hour start - links related snapshots
  hash: string // SHA-256 of normalized JSON
  data: string // Raw API response or process data (uncompressed)
  _creationTime: number // Convex auto-timestamp
}
```

**Indexes:**

- `by_category_key` (category, key)
- `by_sync` (syncTimestamp)
- `by_hash` (hash) - for deduplication

#### `projections` (Enhanced)

```typescript
{
  category: 'model' | 'endpoint'
  key: string // modelKey or endpointId
  syncTimestamp: number // When projection was last updated
  data: object // Processed/normalized data for UI
}
```

## Data Flow

### Sync Process

1. **Start Sync**: Begin with current hour `syncTimestamp`
2. **Fetch Models**: Get model list, store individual `snapshots` with category "model"
3. **Fetch Endpoints**: For each model, get endpoints, store individual `snapshots` with category "endpoint"
4. **Handle Orphans**: Store orphaned models found in frontend but not v1 API
5. **Log Sync**: Store any process metadata in `snapshots` with category "sync_log"

### Change Detection

- Compare hash of new data with latest snapshot for same key
- If different: store new snapshot
- If same: skip storage (no change)
- Natural point-in-time versioning via `syncTimestamp`

### Projection Updates

- Process only entities that changed (different hash)
- Update projection with matching `syncTimestamp`
- Enable historical projection reconstruction from any sync point

## Implementation Plan

### Step 1: Schema Migration

- [ ] Define new schema in `convex/schema.ts`
- [ ] Create migration utilities for existing data
- [ ] Test schema with sample data

### Step 2: Core Sync Engine

- [ ] Rewrite sync actions for granular storage
- [ ] Implement batch coordination
- [ ] Add change detection logic
- [ ] Handle entity lifecycle (appear/disappear/reappear)

### Step 3: Cron Integration

- [ ] Set up hourly cron job
- [ ] Add error handling and retry logic
- [ ] Implement monitoring and alerting

### Step 4: Projection System

- [ ] Update projection generation for new schema
- [ ] Add incremental update capability
- [ ] Ensure historical reconstruction works

### Step 5: Production Deployment

- [ ] Deploy to production environment
- [ ] Monitor initial sync operations
- [ ] Validate data collection and storage

## Key Decisions

### Storage Format

- **Uncompressed**: Easier development, better queryability
- **Individual entities**: Granular change tracking
- **Full API responses**: Preserve all fields for future use

### Entity Identification

- **Models**: Use `modelKey` - our definitive term for the primary model identifier (OpenRouter's `model.id` from `/api/v1/models`)
- **Endpoints**: Use `endpointId` - the UUID from OpenRouter's API
- **Orphans**: Derive `modelKey` from available fields when endpoints are unavailable

### Sync Coordination

- **Hour-aligned timestamps**: Consistent `syncTimestamp` for all related snapshots
- **Simple storage**: Store everything in polymorphic `snapshots` table
- **Minimal coordination**: Let data speak for itself rather than complex state tracking

## Risks and Mitigations

### Schema Changes

- **Risk**: OpenRouter adds/removes/changes fields
- **Mitigation**: Store raw responses, validate only essential fields

### Storage Growth

- **Risk**: Uncompressed storage uses more space
- **Mitigation**: Paid Convex account, future compression/archival

### Sync Failures

- **Risk**: Partial syncs create inconsistent state
- **Mitigation**: Batch tracking, rollback capability, retry logic

### Memory Constraints

- **Risk**: Large responses (especially model-authors) exceed limits
- **Mitigation**: Defer problematic endpoints, process in chunks

## Success Metrics

### Phase 1 Success

- [ ] Hourly syncs running automatically
- [ ] All model and endpoint data captured
- [ ] Zero data loss during schema changes
- [ ] Projection system working with new storage

### Long-term Success

- [ ] Historical data analysis capabilities
- [ ] Efficient change tracking and alerting
- [ ] Sustainable storage growth management
- [ ] Complete OpenRouter ecosystem coverage

## Current Status

**Phase**: Planning
**Next Action**: Begin schema design and migration planning
**Blockers**: None
**Timeline**: Target production launch within 1-2 weeks
