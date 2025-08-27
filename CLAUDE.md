# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
bun check      # Runs both typecheck and lint with zero warnings - use this to verify your work
```

## Architecture Overview

### Core Purpose

ORCHID (OpenRouter Capability & Health Intelligence Dashboard) aggregates and tracks AI model availability data from OpenRouter, creating a historical record of the evolving AI model ecosystem through hourly snapshots.

### Tech Stack

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript
- **Backend**: Convex (real-time database + serverless functions)
- **Package Manager**: Bun (script runner, not runtime)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **State Management**: Convex queries/mutations + nuqs for URL state
- **Validation**: Zod v4
- **Data Processing**: Remeda (frontend and backend)

### Project Structure

**Frontend (`/app`)**:

- `/models` - Main dashboard showing OpenRouter models with filtering/sorting
- `/models/[...slug]` - Individual model detail pages
- `/providers` - Provider listing (feature-flagged)
- `/changes` - Model/endpoint change tracking
- `/dev/*` - Development utilities and debugging pages

**Backend (`/convex`)**:

- `/db/` - Database table definitions and helpers
- `/snapshots/` - Data collection and processing pipeline
  - `/crawl.ts` - Main data collection orchestrator
  - `/transforms/` - Raw data transformation logic
  - `/materialize/` - User-facing data preparation
- `/views/` - Public query functions for frontend
- `/schema.ts` - Database schema definitions
- `/crons.ts` - Scheduled jobs (hourly snapshots)
- `/http.ts` - HTTP endpoints (archives, etc.)

**Components (`/components`)**:

- Domain-specific components organized by feature area
- `/ui/` - Reusable shadcn/ui components
- `/shared/` - Cross-domain reusable components
- `/dev-utils/` - Development utilities including feature flags
- Feature-specific directories: `/model-endpoints-filter/`, `/endpoint-data-table/`, etc.

### Key Architectural Patterns

**Snapshot-Based Architecture**:

- All data captured in hourly snapshots for point-in-time reconstruction
- Derived state can be completely regenerated from raw snapshots
- Historical preservation of models/endpoints that disappear

**Data Processing Pipeline**:

1. **Crawl**: Fetch raw data from OpenRouter APIs
2. **Transform**: Extract/clean data with validation schemas
3. **Materialize**: Create optimized query structures for frontend

**Data Fetching**:

- Frontend uses Convex queries with `convex-helpers` for caching
- Custom `useCachedQuery` hook in `/hooks/use-cached-query.ts` provides query timing
- Real-time updates via Convex reactive queries

**URL State Management**:

- Filtering and search state persists in URLs using `nuqs` for shareability
- React 19 async params: server pages must await params, client pages wrapped in `<Suspense>`

### Database Schema

**Core OpenRouter Entities**:

- `or_models` - Model metadata and capabilities (~395 models)
- `or_endpoints` - Provider implementations with pricing/limits (~670 endpoints)
- `or_providers` - AI provider information (~63 providers)
- `or_changes` - Historical change tracking
- `or_model_token_stats` - Daily usage metrics
- `or_apps` - Applications using models

**Snapshot System**:

- `snapshot_crawl_config` - Configuration for data collection
- `snapshot_crawl_archives` - Compressed raw API responses with SHA256 checksums
- `snapshots` (legacy) - Version 0 archived data

### Data Characteristics

- **Moderate Volume**: ~400 models, ~700 endpoints, ~60 providers
- **High Change Frequency**: Daily changes in availability, pricing, capabilities
- **Historical Value**: Tracking when models appear/disappear provides unique insights
- **Query Optimization**: Data denormalized for sub-second performance

## Development Guidelines

### Core Philosophy (from .cursor/rules)

**Derived State is Expendable**: All processed data can be regenerated from snapshots
**Embrace Change**: APIs will break, schemas will evolve, complete rewrites are inevitable
**Temporal Awareness**: All data exists within snapshot-defined time periods
**Graceful Degradation**: Continue functioning when components fail
**Query-First Design**: Optimize for read performance and boolean filtering

### Component Organization

- Group related components in feature directories
- Follow existing patterns for data tables, filtering, and sorting
- Use shadcn/ui-inspired component structure with composable parts
- No default exports, destructure className prop with `cn()` helper
- Component locations:
  - Route components: `app/[relevant-directory]`
  - Major components: `components/` or `components/<component-name>/`
  - Shared utilities: `components/shared/`
  - UI primitives: `components/ui/`

### Convex Patterns

**Function Organization**:

- Actions for external API calls and orchestration
- Mutations for database writes with validation
- Queries for reactive data fetching
- Use `internal.*` for cross-function calls
- Helper functions with `(ctx, args)` pattern for shared logic

**Error Handling**:

- Never return values from actions/internalActions (causes type issues)
- Use structured logging: `console.log('[domain:action] message', { data })`
- Log failures but continue processing (graceful degradation)
- Fail fast rather than catching errors just to log

**Data Validation**:

- Convex uses file-based routing (no dashes in filenames)
- Transform schemas for cleaning OpenRouter data
- Strict validation but continue on individual failures

### Styling Conventions

**Design Philosophy**:

- Technical aesthetic: stark, functional, modern terminal look
- Dark theme only
- Monospace fonts for technical content
- Minimal padding, sharp corners, no shadows
- Color primarily in text (status indicators, logos)
- Desktop-first, information-dense interfaces

**Implementation**:

- Tailwind v4 configured in `app/globals.css` (no JS config)
- Use standard shadcn/ui theme variables exclusively
- `cn()` utility for conditional styling
- Default sizes: `text-xs` for badges, `border-border` default
- Font classes like `font-mono` at component root level (cascades down)

### State Management

- URL state for filters/search using `nuqs`
- Component state for UI interactions
- Convex for all data persistence and real-time updates
- Feature flags via localStorage (FeatureFlag component)

### Testing

- No formal testing framework currently configured
- Verify work with `bun check` for type/lint errors
- Feature flags allow safe testing of live prototypes with production data

## Important Notes

- **Production Status**: Soft-launched publicly but not promoted, negligible traffic
- **Data Pipeline**: Hourly snapshots running, creating production archives
- **Environment**: Bun package manager, Node.js not used as runtime
- **External APIs**: OpenRouter data structures change without notice
- **Recovery Strategy**: Rebuild from snapshots rather than complex migrations
