# Snapshot Keys Design Analysis

## The Problem

Our snapshot system faces a fundamental indexing challenge due to how we collect and potentially consume the data:

**Collection Pattern (By Column)**: We insert data category-by-category due to OpenRouter API constraints:

- Fetch all models → store as `models` category
- For each model → fetch endpoints → store as `endpoints:modelId`
- For each model → fetch uptime data → store as `uptime-recent:modelId`

**Consumption Pattern (By Row)**: We may want to analyze data model-by-model:

- Get all data for `gpt-4` across all categories
- Compare `gpt-4` vs `claude-3` over time
- Build model-specific dashboards

**Scale Constraint**: With ~2000 models and multiple data categories per epoch, we can easily have 10,000+ snapshot records per hour. Unindexed filters risk hitting Convex query limits.

## Current Schema & Constraints

```typescript
snapshots: {
  category: string,    // 'models', 'endpoints', 'uptime-recent', etc.
  key: string,         // '', modelId, authorSlug, etc.
  epoch: number,       // Hour-aligned timestamp
  data: string,        // JSON snapshot
  // ... other fields
}
```

**Current Indexes**:

- `by_category_key_epoch` - Optimized for category-based queries
- `by_category_epoch` - Optimized for "all of category X in epoch Y"

**Current Query Patterns**:

- ✅ Get models for epoch: `category='models', epoch=X`
- ✅ Get endpoints for specific model: `category='endpoints', key='gpt-4', epoch=X`
- ❌ Get all data for specific model: Requires multiple queries or table scan

## Potential Query Patterns

### Current Production Needs

1. **Sync Coordination**: Get model-list, endpoint-ids-list for epoch
2. **Status Monitoring**: Get all sync statuses for epoch
3. **Projection Building**: Get all models + all endpoints for epoch

### Future Analysis Needs

4. **Model Timeline**: All data for specific model across epochs
5. **Cross-Model Comparison**: Same data type for multiple models in epoch
6. **Provider Analysis**: All models from specific provider/author
7. **Availability Tracking**: Uptime data for model over time
8. **Pricing History**: Endpoint pricing changes for model

## Potential Approaches

### Option 1: Current Design (Category-First)

**Schema**: `category + key + epoch`

**Indexes**:

- `by_category_key_epoch` (current)
- `by_category_epoch` (current)

**Pros**:

- Matches our insertion pattern perfectly
- Efficient for sync coordination queries
- Works well for projection building

**Cons**:

- Model-centric queries require multiple round-trips
- No efficient "all data for model X" query
- Forces application-level data joining

**Query Examples**:

```typescript
// ✅ Efficient
await ctx.db
  .query('snapshots')
  .withIndex('by_category_epoch', (q) => q.eq('category', 'models').eq('epoch', epoch))

// ❌ Inefficient - multiple queries needed
const endpoints = await ctx.db
  .query('snapshots')
  .withIndex('by_category_key_epoch', (q) =>
    q.eq('category', 'endpoints').eq('key', 'gpt-4').eq('epoch', epoch),
  )
const uptime = await ctx.db
  .query('snapshots')
  .withIndex('by_category_key_epoch', (q) =>
    q.eq('category', 'uptime-recent').eq('key', 'gpt-4').eq('epoch', epoch),
  )
```

### Option 2: Dual Index System

**Schema**: Same as current

**Indexes**:

- `by_category_key_epoch` (insertion-optimized)
- `by_key_category_epoch` (model-optimized)

**Pros**:

- Efficient for both insertion and analysis patterns
- Single query for "all data for model X"
- Backwards compatible

**Cons**:

- Storage overhead for extra index
- Index maintenance cost
- Empty keys ('') less efficient in key-first index

**Query Examples**:

```typescript
// ✅ Category-first (current use)
await ctx.db
  .query('snapshots')
  .withIndex('by_category_key_epoch', (q) => q.eq('category', 'models').eq('key', '').eq('epoch', epoch))

// ✅ Model-first (new capability)
await ctx.db
  .query('snapshots')
  .withIndex('by_key_category_epoch', (q) => q.eq('key', 'gpt-4').eq('epoch', epoch))
```

### Option 3: Unified EntityKey

**Schema**: `entityKey + epoch` (previous proposal)

**EntityKey Format**: `{type}:{identifier}` or `{type}`

**Indexes**:

- `by_entity_epoch`

**Pros**:

- Single index handles most patterns
- Self-describing keys
- Prefix-based range queries possible

**Cons**:

- Model-centric queries still require filtering
- String operations for key parsing
- Harder to reason about key ordering

**Query Examples**:

```typescript
// ✅ Global data
await ctx.db
  .query('snapshots')
  .withIndex('by_entity_epoch', (q) => q.eq('entityKey', 'models').eq('epoch', epoch))

// ❌ Model data - requires filtering
await ctx.db
  .query('snapshots')
  .withIndex('by_entity_epoch')
  .filter((q) =>
    q.and(
      q.eq(q.field('epoch'), epoch),
      q.or(
        q.eq(q.field('entityKey'), `endpoints:gpt-4`),
        q.eq(q.field('entityKey'), `uptime-recent:gpt-4`),
        // ... need to know all possible categories
      ),
    ),
  )
```

### Option 4: Separate Model-Centric Table

**Schema**:

- `snapshots` (current) - for global/coordination data
- `model_snapshots` - for model-specific data

```typescript
model_snapshots: {
  modelId: string,     // 'gpt-4', 'claude-3', etc.
  category: string,    // 'endpoints', 'uptime-recent', etc.
  epoch: number,
  data: string,
}
```

**Indexes**:

- `snapshots`: `by_category_epoch`
- `model_snapshots`: `by_model_epoch`, `by_model_category_epoch`

**Pros**:

- Optimized for both patterns
- Clear separation of concerns
- Efficient model-centric queries

**Cons**:

- Schema complexity
- Data duplication decisions needed
- More tables to maintain

## Considerations

### Data Volume Implications

With ~2000 models × 5 categories × 24 epochs/day = ~240,000 records/day:

**Index Size**: Each additional index increases storage ~15-20%
**Query Performance**: Unindexed filters become expensive at scale
**Archive Strategy**: Will we archive by epoch or by model timeline?

### API Response Patterns

**OpenRouter Quirks**:

- Models endpoint returns all models (no pagination)
- Endpoints must be fetched per-model
- Some data only available at author level
- Orphaned models exist in frontend but not v1 API

### Future Requirements

**Likely Analysis Patterns**:

- Model availability dashboards
- Pricing change alerts
- Provider reliability analysis
- Historical model performance
- Market share analysis by model/provider

**Archive Requirements**:

- Compress old epochs while preserving queryability
- Maintain model timelines efficiently
- Support both epoch-based and model-based archival

## Recommendation

**Short Term**: Implement **Option 2 (Dual Index System)**

**Rationale**:

- Minimal schema changes
- Immediate support for model-centric queries
- Backwards compatible with existing code
- Modest storage overhead acceptable at current scale

**Implementation**:

```typescript
snapshots: defineTable({
  category: v.string(),
  key: v.string(),
  epoch: v.number(),
  // ... other fields
})
  .index('by_category_key_epoch', ['category', 'key', 'epoch']) // current
  .index('by_key_epoch', ['key', 'epoch']) // new
```

**Long Term**: Consider **Option 4 (Separate Tables)** when:

- Data volume requires optimization
- Archive strategy is defined
- Analysis patterns are well understood

The dual index approach gives us immediate flexibility while we gather more data about actual usage patterns and optimization needs.
