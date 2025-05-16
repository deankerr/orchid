# Technology Context

## Core Technologies

### Frontend

- **Next.js**: React framework for frontend rendering and routing
- **TypeScript**: For type-safe code across the application
- **shadcn/ui**: Component library for UI elements

### Backend

- **Convex**: Backend-as-a-service for database and server functions
  - Used for storing model and endpoint data
  - Provides real-time updates and query capabilities
  - Handles data synchronization with OpenRouter API

### API Integration

- **OpenRouter API**: Source of AI model and endpoint data
  - `/models` endpoint for basic model listing
  - `/models/{id}/endpoints` for detailed endpoint information
- **Zod**: Schema validation for API responses

## Development Environment

- **Bun**: Package manager and runtime
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting

## Data Integration

### OpenRouter API Structure

- Models have general information (architecture, context length)
- Endpoints provide provider-specific implementations
- Pricing varies by provider for the same model

### Data Processing Flow

1. Fetch data from OpenRouter API
2. Transform data to match Convex schema
3. Store in normalized tables (models, endpoints)
4. Query through type-safe Convex functions

### Type System

- Zod schemas for API validation
- Convex validators for database schema
- TypeScript types for frontend and backend consistency

## Convex Best Practices

### Function Design

- Use type annotations instead of validators for internal functions

  ```typescript
  // Preferred approach for internal functions
  handler: async (ctx, args: MyType) => {
    // function body
  }
  ```

- Return document IDs (or null) from mutations

### Code Organization

- Create standalone transformation utility functions for API to DB conversions
- Avoid duplicating transformation logic in mutations or actions
- Use dedicated query functions for existence checks rather than duplicating query logic

### Type Safety

- Add explicit return type annotations to all actions and mutations
- Use explicit typing for arrays and promises in async operations
- Export schema type definitions for reuse across the application

## Security Considerations

- API key management for OpenRouter integration
- Rate limiting to respect OpenRouter's usage policies
- Proper error handling for API failures

## Performance Considerations

- Database indexes for common query patterns
- Caching strategy for model data
- Pagination for large result sets

## Deployment

- Vercel for frontend hosting
- Convex Cloud for backend services

## Testing Strategy [?]

- Unit tests for data transformation functions
- Integration tests for API communication
- End-to-end tests for critical user flows
