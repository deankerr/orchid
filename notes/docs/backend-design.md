# ORCHID Backend Design Rationale

This document explains the key design decisions behind ORCHID's backend architecture, particularly those that might seem unconventional at first glance. These choices are deliberate responses to the unique challenges of building a system around external APIs we can't control.

## Core Challenge: Uncontrolled Data Sources

ORCHID is fundamentally about dealing with data we can't control. OpenRouter's APIs:
- Change structure without notice
- Return massive amounts of excess, duplicated data
- Require multiple API calls to build a complete picture of simple concepts
- May fail intermittently or return partial data
- Evolve rapidly as the LLM field shifts every few months

Our architecture is designed to be **powerful and resilient** despite whatever changes come next.

## Design Decision 1: Hour-Aligned Snapshots ("Epochs")

### The Problem
A complete picture of a "model" - something users think of as a basic primitive - actually requires several different API calls compiled together. What happens when one endpoint fails repeatedly but succeeds 30 minutes later? Is that part of the same logical snapshot?

### Our Solution: Snapshot Hours
We align all data collection to hour boundaries (3:45 PM data gets marked as 3:00 PM). This creates:
- **Logical snapshot coherence**: All data collected in an hour belongs to the same generation attempt
- **Retry semantics**: Failed calls that succeed later are still part of the same snapshot
- **Efficient querying**: Convex performs much better with exact value matches than time ranges
- **Appropriate granularity**: We don't need intra-hour precision for OpenRouter data

This isn't arbitrary - it's a deliberate solution to distributed system challenges when assembling complete pictures from multiple unreliable sources.

### Terminology Update
We're renaming "epoch" to `snapshot_hour` to make this concept clearer.

## Design Decision 2: Dual Validation Strategy

### The Problem
The LLM field changes rapidly with game-changing shifts every few months. OpenRouter's APIs return massive amounts of excess, useless, duplicated data. We can't manually review data daily to catch when something relevant appears that we don't know about.

### Our Solution: Transform + Strict Schemas
We use two Zod schemas for every API response:

1. **Transform Schema**: Extracts and shapes only the data we need for operation
2. **Strict Schema**: Validates our complete understanding of the API structure

This isn't "validating twice" - it's informed by Zod's mechanics:
- Transform schema: Prunes excess data, allows unknown fields, critical for operation
- Strict schema: Fails on unknown fields, detects API changes, informational only

This is the **only and best way** to achieve both operational reliability and change detection.

## Design Decision 3: Granular Snapshot Storage

### The Problem
Different API endpoints return vastly different amounts of data. Debugging requires seeing exact API responses. Reprocessing should be selective, not all-or-nothing.

### Our Solution: Individual Snapshot Files
Each API response gets its own compressed file:
```
or-models-snapshot-{timestamp}
or-endpoints-gpt-4-default-snapshot-{timestamp}
or-author-openai-snapshot-{timestamp}
```

This provides:
- **Precise debugging**: See the exact API response that caused issues
- **Selective reprocessing**: Update just what failed
- **Efficient storage**: Compress based on actual data size
- **Clear audit trail**: One file per API call

## Design Decision 4: Table Naming with Source Distinction

### The Problem
We're building a system that will expand beyond just OpenRouter data. We'll add:
- Our own model benchmarks and quality tests
- Prompting tips and best practices
- Data from other sources and research

### Our Solution: Source-Prefixed Tables
**OpenRouter-derived current state:**
```
or_models, or_endpoints, or_providers, or_authors, or_apps
```

**OpenRouter-derived time-series:**
```
or_model_metrics, or_endpoint_metrics, or_uptime_metrics, or_app_metrics
```

**Future non-OpenRouter data:**
```
model_benchmarks, endpoint_quality_tests, model_prompting_tips
```

The `or_` prefix marks "this is OpenRouter's view of the data" - distinct from our own future data sources.

## Design Decision 5: Materialized Views Architecture

### The Problem
Convex isn't efficient for complex time-range queries over large datasets. We need sub-second response times for user-facing queries. Raw snapshot data isn't optimized for the access patterns we need.

### Our Solution: Snapshot → Views Pipeline
1. **Raw snapshots** stored as immutable files (source of truth)
2. **Materialized views** derived and optimized for queries
3. **Point-in-time reconstruction** possible from any historical snapshot
4. **Change tracking** for monitoring what's evolving

This follows the materialized view pattern - just implemented with files instead of database features. Views are expendable and regeneratable, snapshots are permanent.

## Design Decision 6: Phased Dependency Processing

### The Problem
OpenRouter's data has natural dependencies:
- Endpoint URLs are built from model identifiers
- Author slugs are extracted from model data
- Apps are queried per model variant

### Our Solution: Dependency-Aware Phases
**Phase 1 (Parallel):** Independent entities
- Models and Providers fetch simultaneously

**Phase 2 (Parallel, needs Phase 1):** Dependent entities
- Endpoints, Apps, and Authors all need model data but can run together

This isn't "rigid" - it's **respecting natural data relationships**. We can reconfigure as needed, but the dependencies are real.

## Design Decision 7: Graceful Degradation at Multiple Levels

### The Problem
External APIs are unreliable. Individual failures shouldn't cascade and stop the entire system.

### Our Solution: Layered Error Handling
- **Phase level**: If models fail, skip dependent phases (partial data > no data)
- **Entity level**: Individual API failures don't stop other entities
- **Validation level**: Transform failures skip that item, strict failures are logged
- **Batch level**: Large datasets split to avoid timeouts

The system continues functioning with whatever data it can collect.

## Design Decision 8: All Metrics Are Time-Series

### The Problem
We initially thought some data was "current state" vs "time-series", but actually:
- We keep all historical data from every snapshot
- Everything can be graphed over time
- Users want to see trends in endpoint performance, app usage, etc.

### Our Solution: Unified Time-Series Approach
All metrics tables store historical data:
- Some get timestamps from OpenRouter's data (can backfill)
- Others use our `snapshot_hour` as the timestamp
- But they're all equally valid time-series data for analysis

## Summary: Building for an Unpredictable Future

Every design decision in ORCHID is informed by one reality: **we're building around data sources we can't control**. The architecture prioritizes:

1. **Resilience**: Continue working when parts fail
2. **Observability**: Always know what happened and why
3. **Flexibility**: Easy to adapt when APIs change
4. **Performance**: Sub-second queries despite complex data relationships
5. **Completeness**: Capture everything, decide what to use later

These aren't arbitrary technical choices - they're responses to the fundamental challenge of building reliable systems on top of rapidly evolving, unpredictable external APIs. The result is a system that's more complex than a typical CRUD app, but far more capable of surviving the chaos of the modern AI ecosystem. 