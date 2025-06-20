# ORCHID Backend Documentation

Welcome to the ORCHID backend documentation. This guide explains the sophisticated data synchronization and processing system that powers ORCHID's AI model intelligence platform.

## Documentation Overview

### 📋 [Snapshot/Views System Overview](./snapshot-views-system.md)
Start here to understand ORCHID's architecture. This document covers:
- Multi-phase data collection process
- Granular snapshot storage strategy
- Dual validation approach
- Design philosophy and benefits

### 🔧 [Implementation Guide](./snapshot-views-implementation.md)
Detailed explanation of how the system works:
- Entity processing patterns
- Batch processing for large datasets
- Merge operations and change tracking
- Error handling at multiple levels

### ⚡ [Quick Reference](./snapshot-views-quick-reference.md)
Practical guide for common tasks:
- Snapshot file patterns
- Debugging validation issues
- Batch processing limits
- Adding new entity types

### 📊 [Entity Reference](./entity-reference.md)
Complete guide to ORCHID's data model:
- Key identifiers (slug, permaslug, variant)
- All entity types and their relationships
- How OpenRouter exposes data
- Our transformation approach

## Core Architecture

### The Snapshot System

ORCHID's snapshot system is an intelligent orchestrator that:
1. **Collects data** from OpenRouter APIs in dependency-aware phases
2. **Stores granular snapshots** of each API response individually
3. **Validates thoroughly** using dual schemas (transform + strict)
4. **Merges validated data** into view tables with change tracking
5. **Generates summary reports** of the entire sync run

### Key Innovation: Granular Storage

Rather than one monolithic snapshot, each API call gets its own file:

```
openrouter-models-snapshot-{timestamp}
openrouter-endpoints-gpt-4-default-snapshot-{timestamp}
openrouter-author-openai-snapshot-{timestamp}
```

This provides:
- Precise debugging (see exact API response)
- Selective reprocessing (update just what failed)
- Efficient storage (compress based on size)
- Clear audit trail (one file per API call)

### Phased Collection

The system respects data dependencies through phases:

```
Phase 1 (Parallel):
├── Providers (independent)
└── Models (independent)

Phase 2 (Parallel, needs Models):
├── Endpoints (URLs built from model IDs)
├── Apps (stats per model variant)
└── Authors (slugs extracted from models)
```

## Key Concepts

### Identifiers
- **Slug**: Human-readable ID (e.g., `gpt-4`)
- **Permaslug**: Versioned ID with date (e.g., `gpt-4:2024-05-13`)
- **Variant**: Model configuration (e.g., `default`, `free`)
- **UUID**: Used for endpoints and authors

### Epochs
Hour-aligned timestamps providing consistent temporal boundaries. A snapshot at 3:45 PM gets epoch 3:00 PM.

### Dual Validation
Every API response undergoes two validations:
- **Transform Schema**: Extracts needed fields, tolerates unknowns (operational)
- **Strict Schema**: Validates complete structure, detects changes (monitoring)

### Batch Processing
Large datasets are split to avoid Convex limits:
- App tokens: 2,000 per batch
- Model token stats: 5,000 per batch
- Endpoint uptimes: 5,000 per batch

### MergeResult
Tracks what happens during view updates:
- `insert`: New entity added
- `replace`: Existing entity updated
- `stable`: No changes detected

## Quick Start

1. **Trigger a snapshot**: Run `internal.openrouter.snapshot.startSnapshot`
2. **Find snapshots**: Look for files matching entity patterns
3. **Check issues**: Review validation problems in summary
4. **Debug failures**: Load specific snapshot files

## Design Principles

1. **Granular Storage** - Each API response in its own file
2. **Dependency Awareness** - Phases respect natural relationships
3. **Graceful Degradation** - Partial data better than none
4. **Complete Observability** - Every action is trackable
5. **Efficient Processing** - Parallel where possible, batch when needed

## Common Patterns

### Entity Processing
```
1. Fetch from API endpoint
2. Store snapshot immediately
3. Validate with dual schemas
4. Transform to view format
5. Track issues with identifiers
6. Return data + issues
```

### Error Handling
- **Phase failures**: Skip dependent phases
- **Entity failures**: Continue with others
- **Validation failures**: Log but don't stop
- **Batch failures**: Split and retry

### Adding New Entities
1. Determine phase (independent or dependent?)
2. Create sync function following pattern
3. Define transform + strict schemas
4. Store snapshots with consistent naming
5. Handle batching if needed
6. Create merge function for views

## Architecture Benefits

- **Debuggable**: Individual snapshots for each API call
- **Resilient**: Failures isolated, partial success possible
- **Scalable**: Batch processing handles large datasets
- **Flexible**: Easy to add entities or change schemas
- **Auditable**: Complete history in immutable files
- **Efficient**: Parallel execution, compressed storage

## Need Help?

- For architecture understanding → [System Overview](./snapshot-views-system.md)
- For implementation details → [Implementation Guide](./snapshot-views-implementation.md)
- For quick tasks → [Quick Reference](./snapshot-views-quick-reference.md)
- For entity details → [Entity Reference](./entity-reference.md)
- For code examples → Check `/convex/openrouter/entities/` 