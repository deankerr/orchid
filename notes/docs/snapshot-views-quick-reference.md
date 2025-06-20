# Snapshot/Views Quick Reference

## Key Concepts

### Epochs
- Hour-aligned timestamps (3:45 PM → 3:00 PM)
- Used for temporal consistency across all data
- Generated with `getEpoch()` function

### Granular Snapshots
- Individual API responses stored as separate files
- Named with descriptive patterns: `openrouter-{entity}-{identifier}-snapshot-{timestamp}`
- Stored during sync process, not at the end
- Compressed with gzip by default

### Dual Validation
- **Transform Schema**: Extracts needed fields, allows unknown fields
- **Strict Schema**: Validates complete structure, fails on unknown fields
- Both run on every API response

### Batch Processing Limits
- App tokens: 2,000 per batch
- Model token stats: 5,000 per batch
- Endpoint uptimes: 5,000 per batch

## Common Operations

### Running a Manual Snapshot

Trigger a snapshot outside the normal hourly schedule:
```
Execute: internal.openrouter.snapshot.startSnapshot
Args: { compress: true }
```

### Finding Snapshot Files

Snapshots are stored with specific patterns per entity type:
```
Models: openrouter-models-snapshot-{timestamp}
Providers: openrouter-providers-snapshot-{timestamp}
Endpoints: openrouter-endpoints-{model}-{variant}-snapshot-{timestamp}
Apps: openrouter-apps-{model}-{variant}-snapshot-{timestamp}
Authors: openrouter-author-{slug}-snapshot-{timestamp}
```

Use `listFilesByPattern` to find specific snapshots.

### Accessing Snapshot Data

1. Find snapshot file by key pattern
2. Retrieve using `retrieveJSONByKey`
3. Data contains raw API response
4. Check validation issues in summary report

## Data Flow Summary

### Phase 1 (Parallel)
- **Models**: Fetch all, consolidate variants
- **Providers**: Fetch all infrastructure providers

### Phase 2 (Parallel, needs Phase 1)
- **Endpoints**: For each model variant, fetch endpoint stats + uptime
- **Apps**: For each model variant, fetch app usage
- **Authors**: For each unique author slug from models

### Processing Pattern

Each entity follows:
1. Fetch from API
2. Store snapshot immediately
3. Validate with dual schemas
4. Transform to view format
5. Track issues with identifiers
6. Return data + issues

## Understanding Issues

### Issue Types
- `transform`: Critical - data extraction failed
- `schema`: Informational - unknown fields detected
- `sync`: API call or network failure

### Issue Identifiers
Examples:
- `models:42` - Model at index 42 in array
- `gpt-4-default:0` - First endpoint for gpt-4 default variant
- `author-openai:0` - OpenAI author data
- `uptime-{uuid}` - Uptime data for specific endpoint

## Debugging

### Check Individual Snapshots
Each API call creates its own snapshot:
- Model snapshots show all variants
- Endpoint snapshots are per model/variant
- Author snapshots are per author slug

### Common Failure Patterns

**"No models found"**
- Models API failed in Phase 1
- Phase 2 will be skipped entirely
- Check models snapshot file

**High validation failures**
- Transform failures = breaking changes
- Schema failures = new fields added
- Check specific snapshot files

**Batch timeouts**
- Too much data for single mutation
- Increase batch splitting
- Check batch size constants

## Performance Tips

### Maximize Parallelism
- Phase 1: Providers + Models run together
- Phase 2: All three entity types run together
- Within entity: Multiple variants can process in parallel

### Storage Efficiency
- Snapshots compressed by default
- Granular storage = smaller files
- Only changed data triggers view updates

### Batch Processing
- Use `processBatchMutation` for large datasets
- Tune batch sizes based on data volume
- Monitor for timeout errors

## Adding New Entity Types

### Quick Checklist

1. **Determine phase**: Independent (Phase 1) or needs models (Phase 2)?
2. **Create sync function**:
   ```typescript
   export async function syncNewEntity(
     ctx: ActionCtx,
     config: SyncConfig,
     dependencies?: any
   ): Promise<{
     entities: EntitySyncData<NewEntity>
   }>
   ```
3. **Add validation schemas**: Transform + Strict
4. **Store snapshots**: Use consistent naming pattern
5. **Handle batching**: If large datasets expected
6. **Create merge function**: For view updates
7. **Add to phase**: Include in parallel execution

### Snapshot Naming Convention
```
openrouter-{entityType}-{identifier}-snapshot-{timestamp}
```

Examples:
- Single entities: `openrouter-settings-snapshot-{timestamp}`
- Per-model: `openrouter-pricing-{model}-{variant}-snapshot-{timestamp}`
- Per-identifier: `openrouter-usage-{userId}-snapshot-{timestamp}`

## Recovery Procedures

### Reprocess Specific Entity
1. Find relevant snapshot files
2. Load and validate with current schemas
3. Run merge operations manually
4. Check for changes in MergeResult

### Rebuild from Snapshots
1. List all snapshots for time range
2. Process in chronological order
3. Run appropriate sync functions
4. Merge into view tables

### Debug Validation Issues
1. Load specific snapshot file
2. Run validation manually
3. Compare transform vs strict results
4. Update schemas if needed

## Best Practices

1. **Snapshot keys**: Make them descriptive and parseable
2. **Issue identifiers**: Include enough context to locate problem
3. **Batch sizes**: Leave headroom for growth
4. **Error handling**: Fail individual items, not entire batches
5. **Dependencies**: Always check Phase 1 succeeded before Phase 2
6. **Compression**: Enable for all large responses
7. **Monitoring**: Track snapshot file counts and sizes 