# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**IMPORTANT: When working on this codebase, DO NOT run the dev server or try to build or deploy the project. Use `bun check` to verify your work.**

```bash
bun check      # Runs both typecheck and lint with zero warnings - USE THIS TO VERIFY YOUR WORK
```

## Architecture Overview

### Tech Stack

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript
- **Backend**: Convex (real-time database + serverless functions)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Convex queries/mutations + nuqs for URL state

### Project Structure

**Frontend (`/app`)**:

- `/models` - Main dashboard showing OpenRouter models with filtering/sorting
- `/models/[...slug]` - Individual model detail pages
- `/providers` - Provider listing (feature-flagged)
- `/snapshots` - Data pipeline monitoring (feature-flagged)

**Backend (`/convex`)**:

- `/openrouter/` - Core data collection system for monitoring OpenRouter
- `/schema.ts` - Database schema definitions
- `/crons.ts` - Scheduled jobs (hourly snapshots)

**Components (`/components`)**:

- Domain-specific components organized by feature area
- `/ui/` - Reusable shadcn/ui components
- `/dev-utils/` - Development utilities including feature flags

### Key Architectural Patterns

**Data Collection Pipeline**:
The application runs a sophisticated two-stage data collection system:

1. **Stage 1 (Critical Dependencies)**: Models (required) + Providers
2. **Stage 2 (Model-Dependent)**: Endpoints, Apps, Token Stats

Located in `convex/openrouter/orchestrator.ts`, this system:

- Fetches data from OpenRouter's frontend APIs hourly
- Processes and validates data through dedicated pipelines
- Archives compressed raw responses for historical analysis
- Tracks changes and maintains rolling uptime windows

**Feature Flags**:
Use localStorage-based feature flags via `components/dev-utils/feature-flag.tsx`:

```tsx
<FeatureFlag flag="providers">
  <ProvidersContent />
</FeatureFlag>
```

Toggle in browser console: `toggleFeature('providers')`

**Data Fetching**:

- Frontend uses Convex queries with `convex-helpers` for caching
- Custom `useCachedQuery` hook in `/hooks/use-cached-query.ts` provides query timing
- Real-time updates via Convex reactive queries

**URL State Management**:
Filtering and search state persists in URLs using `nuqs` for shareability

### Database Schema

**Core OpenRouter Entities**:

- `or_models` - Model metadata and capabilities
- `or_endpoints` - Provider implementations with pricing/limits
- `or_endpoint_uptimes` - 72h hourly + 30d daily availability data
- `or_endpoint_stats` - Historical performance metrics
- `or_providers` - AI provider information

**Change Tracking**:
All entities have corresponding `*_changes` tables using JSON diff for audit trails

**Pipeline Management**:

- `snapshot_runs` - Execution tracking with success/failure status
- `snapshot_archives` - Compressed historical API responses
- `snapshot_schedule` - Configurable scheduling with jitter

### Data Processing

**Validation System**:
Dual schema approach in `convex/openrouter/validation.ts`:

- Transform schemas extract/clean data from OpenRouter APIs
- Strict schemas validate expected structure and catch API changes

**Uptime Calculation**:
Rolling window system maintains 72 hours of hourly data points and 30-day averages, with visual status indicators (green ≥99%, amber ≥85%, red <85%)

**Archive System**:
All raw API responses are gzip-compressed and stored with SHA256 checksums for historical analysis via `/archives` HTTP endpoint

## Development Guidelines

**Component Organization**:

- Group related components in feature directories
- Use TypeScript with relaxed `any` rules for rapid prototyping
- Follow existing patterns for data tables, filtering, and sorting

**Convex Patterns**:

- Actions for external API calls and orchestration
- Mutations for database writes with validation
- Queries for reactive data fetching
- Use `internal.*` for cross-function calls

**Styling Conventions**:

- Tailwind classes with `cn()` utility for conditional styling
- shadcn/ui primitives with custom styling
- Dark theme only

**State Management**:

- URL state for filters/search using `nuqs`
- Component state for UI interactions
- Convex for all data persistence and real-time updates

## Feature Flags

Current feature flags control access to:

- `providers` - Providers page visibility
- `snapshots` - Pipeline monitoring dashboard

Enable via browser console or localStorage manipulation for development.

## Cursor Rules Reference

The project includes detailed rules files in `.cursor/rules/` for specific development contexts:

- **backend-data-reference.mdc** - Comprehensive reference for ORCHID's data architecture, OpenRouter ecosystem understanding, and entity relationships. Read when working with database schema, data processing, or needing to understand model/endpoint relationships.

- **convex_rules.mdc** - Complete Convex development guidelines including function syntax, validators, pagination, and best practices. Read when working with any Convex functions, schema definitions, or database operations.

- **frontend.mdc** - Frontend development guide covering design philosophy, component guidelines, React 19/Next.js 15 patterns, and UI standards. Read when working with app/, components/, or frontend styling.

- **philosophy.mdc** - Core project principles including derived state philosophy, graceful degradation, and temporal awareness. Read when making architectural decisions or understanding system design rationale.

- **product.mdc** - Project overview, goals, and user experience context. Read when understanding product requirements or user needs.

- **project.mdc** - Environment setup, library usage, and current project status. Read when setting up development environment or understanding current state.

- **snapshot-system-overview.mdc** - Detailed explanation of the data collection system architecture and OpenRouter API integration. Read when working with convex/openrouter/ or data collection pipelines.
