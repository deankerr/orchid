# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules

- Infinite type recursion issues are caused primarily by returning values from convex actions/internalActions. If there is no concrete reason to return data, don't do it.
- zod version 4 is used, import it like `import z4 from 'zod/v4'`, keeping in mind that the schema API is similar but the zod types system has evolved.

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
- `or_providers` - AI provider information

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
