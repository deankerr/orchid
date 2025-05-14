# System Patterns

## Architecture Overview

ORCHID follows a modern web application architecture:

- Next.js for the frontend and API routes
- Convex for backend database and real-time updates
- shadcn/ui for UI components

## Data Flow [?]

1. **Data Collection**: Scheduled jobs fetch model/provider data from OpenRouter API
2. **Data Processing**: Raw data is processed and enriched before storage
3. **Storage**: Structured data is stored in Convex database
4. **Retrieval**: Frontend queries data through Convex client
5. **Visualization**: Data is presented through configurable UI components

## Potential Architecture Patterns [?]

The following patterns are proposed based on typical Next.js and Convex applications but have not been confirmed for this project:

- **Functional Service Modules**: Self-contained modules for specific functionality (model fetching, data processing)
- **Custom Hooks**: React hooks for data access and state management
- **Server Actions/Functions**: Convex functions for backend operations

## Database Schema [?]

### Proposed Entities

These entities are derived from the project brief but exact schema design is yet to be determined:

- **Model**: Core entity representing an AI model with its capabilities, parameters, and history
- **Provider**: Entity representing services hosting models, with reliability metrics
- **Test**: Structured evaluation scenarios to verify model/provider performance
- **TestResult**: Historical test outcomes linked to models/providers
- **ModelMetadata**: Custom enrichment data added to models
- **ChangeRecord**: Tracking of changes to model/provider availability and capabilities

## API Approach

Some considerations for the API structure:

- How will the frontend query the Convex backend?
- Will we need any Next.js API routes or will Convex handle all data needs?
- What authentication approach should we use?

## State Management [?]

- Server-side state managed through Convex
- Client-side state handled with React hooks and context
- Caching strategy for optimized performance

## Error Handling

Areas to consider:

- How should we handle OpenRouter API failures?
- What logging approach should we implement?
- How will errors be presented to users?

## Security Considerations

- How will we handle API key management for OpenRouter access?
- Do we need to consider rate limiting?
- What data validation approach should we use?
