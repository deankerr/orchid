# Materialized Changes System - Implementation Plan

## Overview

Complete reimplementation of the materialized changes system using atomic change records with aggregation capabilities. This system will track changes between OpenRouter snapshot bundles using the already-materialized `or/views` data.

## Core Design Principles

1. **Atomic Changes**: One field change = one document = one table row
2. **Efficient Querying**: Indexed path components for filtering
3. **Aggregation-First**: Built with Convex Aggregate component integration in mind
4. **Simplified Data Model**: No ADD/REMOVE types, use undefined transitions
5. **Clean Separation**: Raw changes (`or_changes`) remain for admin use, materialized changes (`or_views_changes`) for end users

## Stage 1: Schema and Processing Implementation

### 1.1 Schema Design (`convex/db/or/views/changes.ts`)

```typescript
// Core schema for atomic change records
{
  // Temporal tracking
  crawl_id: string,              // Current snapshot
  previous_crawl_id: string,     // Previous snapshot for comparison
  timestamp: number,             // For time-series aggregation

  // Entity classification
  entity_type: 'model' | 'endpoint' | 'provider',
  change_kind: 'create' | 'update' | 'delete',

  // Entity identifiers (no separate entity_id field)
  model_slug?: string,       // Primary ID for models, grouping for endpoints
  endpoint_uuid?: string,    // Primary ID for endpoints
  provider_slug?: string,    // Primary ID for providers

  // Path indexing (for nested endpoint fields)
  path_level1?: string,      // e.g., 'pricing', 'limits', 'model', 'provider'
  path_level2?: string,      // e.g., 'text_input', 'requests_per_minute'
  field_name: string,        // Full field name for display

  // Change data
  before: v.any(),          // undefined for new fields
  after: v.any(),           // undefined for removed fields
}
```

#### Indexes Required:

- `by_previous_crawl_id__crawl_id`: For pair lookups
- `by_crawl_id`: For latest changes
- `by_entity_type__crawl_id`: Filter by entity type
- `by_change_kind__crawl_id`: Filter by change kind
- `by_model_slug__crawl_id`: All changes for a model
- `by_endpoint_uuid__crawl_id`: All changes for an endpoint
- `by_provider_slug__crawl_id`: All changes for a provider
- `by_path_level1__crawl_id`: Filter by category (e.g., all pricing changes)
- `by_path_level1__path_level2__crawl_id`: Specific field queries

### 1.2 Processing Pipeline (`convex/snapshots/materializedChanges/`)

#### Main Action (`main.ts`)

- Use `paginateAndProcess` to iterate through snapshot archives
- Load and materialize consecutive snapshot pairs
- Call processing functions for each entity type
- Use idempotent mutations to sync changes

#### Process Helper (`process.ts`)

```typescript
// Main processing function
computeMaterializedChanges(before, after) {
  // Process each entity type
  const modelChanges = computeModelChanges(before.models, after.models)
  const endpointChanges = computeEndpointChanges(before.endpoints, after.endpoints)
  const providerChanges = computeProviderChanges(before.providers, after.providers)

  return [...modelChanges, ...endpointChanges, ...providerChanges]
}

// Entity-specific processors
computeModelChanges(before, after) {
  // Simple flat comparison
  // Each changed field becomes one change record
}

computeEndpointChanges(before, after) {
  // Handle nested objects
  // Extract path_level1 and path_level2 for nested fields
  // Skip volatile fields (stats, updated_at)
}

computeProviderChanges(before, after) {
  // Simple flat comparison
  // Handle array fields (datacenters)
}
```

### 1.3 Change Detection Rules

#### Field Types:

- **Scalar fields**: Direct comparison
- **Array fields**: Store full before/after arrays (not item-level diffs)
- **Nested objects**: Flatten to atomic field changes with path components

#### Special Cases:

- **Entity creation**: No field/path data
- **Entity deletion**: No field/path data
- **Field appears**: `before: undefined`, `after: value`
- **Field removed**: `before: value`, `after: undefined`

#### Skip Fields:

- `updated_at`, `unavailable_at` (volatile timestamps)
- `stats` (volatile performance data)
- `_id`, `_creationTime` (Convex internals)

### 1.4 Query API

Basic queries for Stage 1:

```typescript
// List changes for a crawl pair
listPairChanges(previous_crawl_id, crawl_id)

// List all changes with filters
list({
  entity_type?: 'model' | 'endpoint' | 'provider',
  change_kind?: 'create' | 'update' | 'delete',
  model_slug?: string,
  endpoint_uuid?: string,
  provider_slug?: string,
  path_level1?: string,  // e.g., 'pricing'
  path_level2?: string,  // e.g., 'text_input'
})

// Get latest crawl_id
latestCrawlId()
```

## Stage 2: Aggregation and Complex Queries

### 2.1 Aggregate Components Setup (`convex.config.ts`)

```typescript
// Multiple aggregate instances for different views
app.use(aggregate, { name: 'changesByTime' })
app.use(aggregate, { name: 'changesByEntity' })
app.use(aggregate, { name: 'changesByPath' })
app.use(aggregate, { name: 'providerActivity' })
```

### 2.2 Aggregate Definitions

#### Time Series Aggregation

```typescript
const changesByTime = new TableAggregate<{
  Key: number // timestamp
  DataModel: DataModel
  TableName: 'or_views_changes'
}>(components.changesByTime, {
  sortKey: (doc) => doc.timestamp,
  sumValue: (doc) => 1, // Count changes
})
```

#### Entity Aggregation

```typescript
const changesByEntity = new TableAggregate<{
  Namespace: string // entity_type
  Key: string // entity identifier
  DataModel: DataModel
  TableName: 'or_views_changes'
}>(components.changesByEntity, {
  namespace: (doc) => doc.entity_type,
  sortKey: (doc) => doc.model_slug || doc.endpoint_uuid || doc.provider_slug,
})
```

#### Path Category Aggregation

```typescript
const changesByPath = new TableAggregate<{
  Namespace: string // path_level1
  Key: string // path_level2 or field_name
  DataModel: DataModel
  TableName: 'or_views_changes'
}>(components.changesByPath, {
  namespace: (doc) => doc.path_level1 || 'root',
  sortKey: (doc) => doc.path_level2 || doc.field_name,
})
```

### 2.3 Enhanced Query Patterns

```typescript
// Activity feed: "DeepInfra updated pricing on 3 endpoints"
getProviderActivity(provider_slug, timeWindow) {
  const changes = await query({ provider_slug, timestamp: { $gte: timeWindow }})
  // Group by entity and summarize
}

// Change velocity: "Model updates per day over last month"
getChangeVelocity(entity_type, timeWindows) {
  return await changesByTime.countBatch(ctx, timeWindows.map(w => ({ bounds: w })))
}

// Hot fields: "Most frequently changing fields"
getHotFields() {
  return await changesByPath.count(ctx, { namespace: 'pricing' })
}

// Model changelog: Complete history for a model
getModelChangelog(model_slug) {
  // Direct query plus aggregated counts
}
```

### 2.4 Frontend Display Options

#### Data Grid (Existing)

- Tabular view of individual changes
- Sortable, filterable columns
- Detail expansion for complex changes

#### Activity Feed (New)

- Social media style updates
- Grouped changes ("3 pricing updates")
- Time-based grouping
- Provider-centric view

#### Analytics Dashboard (New)

- Change velocity charts
- Hot fields heatmap
- Entity change distribution
- Time series trends

## Migration Path

1. **Delete existing implementation** ✓ (already done)
2. **Implement Stage 1**:
   - Create schema with indexes
   - Build processing pipeline
   - Test with sample data
   - Verify idempotency
3. **Deploy and validate Stage 1**:
   - Run against real snapshots
   - Verify data accuracy
   - Test query performance
4. **Implement Stage 2**:
   - Install Aggregate component
   - Define aggregate instances
   - Update processing to maintain aggregates
   - Build enhanced queries
5. **Update frontend**:
   - Adapt existing data grid
   - Add new UI patterns

## Success Metrics

### Stage 1:

- ✅ All changes accurately captured as atomic records
- ✅ Efficient querying by entity, path, and type
- ✅ Idempotent processing (re-running doesn't duplicate)
- ✅ Clean separation from raw changes system

### Stage 2:

- ✅ O(log n) aggregation queries
- ✅ Support for activity feeds and analytics
- ✅ No contention between unrelated data updates
- ✅ Flexible UI patterns enabled

## Open Questions

1. **Historical Data**: Should we backfill changes for all historical snapshots?
2. **Retention**: How long to keep atomic change records?
3. **Batch Size**: Optimal batch size for processing pipelines?
4. **Cache Strategy**: Should we cache aggregate results for common queries?

## Next Steps

1. Review and approve this plan
2. Begin Stage 1 implementation with schema creation
3. Set up test harness with sample snapshot data
4. Implement processing pipeline
5. Validate with real data
