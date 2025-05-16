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

## Database Schema

The Convex database schema includes:

### Models Table

Stores core information about AI models:

- `modelKey`: Unique identifier (from OpenRouter)
- `displayName`: Human-readable name
- `modelCreated`: Timestamp when added to OpenRouter
- `description`: Model description
- `architecture`: Object containing:
  - `inputModalities`: Array of input types (text, image, etc.)
  - `outputModalities`: Array of output types
  - `tokenizer`: Tokenization method
  - `instructType`: Instruction format (ChatML, etc.)
- `contextLength`: Maximum context window size
- `supportedParameters`: Array of parameters the model supports

### Endpoints Table

Stores provider-specific implementations of models:

- `modelKey`: Reference to the model
- `providerName`: Name of the provider (Lambda, DeepInfra, etc.)
- `contextLength`: Context window for this specific endpoint
- `maxCompletionTokens`: Maximum output tokens
- `maxPromptTokens`: Maximum input tokens
- `quantization`: Quantization level (fp8, etc.)
- `status`: Operational status
- `pricing`: Object containing:
  - `prompt`: Cost per input token
  - `completion`: Cost per output token
  - Various other pricing parameters (image, request, etc.)
- `supportedParameters`: Array of parameters supported by this endpoint

### Indexes

- `by_modelKey`: For model lookup
- `by_providerName`: For provider filtering
- `by_modelKey_and_providerName`: For combined lookups

## API Approach

For data synchronization with OpenRouter:

- `transforms.ts`: Utility functions to convert API responses to DB schema
- `importModel` / `importEndpoint`: Internal mutations to create/update records
- `syncModels`: Action to sync a single model and its endpoints

For data retrieval:

- `findEndpointsByCapabilities`: Query to filter endpoints by specific capabilities
- `getModelByKey` / `getEndpointByModelAndProvider`: Queries to check existence

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

# System Architecture and Technical Decisions

## OpenRouter Sync Refactor

### Changes Made

1. **Combined Sync Actions**: Merged `syncModelEndpoints` and `batchSync` into a single `syncModels` action that can handle:

   - Syncing a specific list of models
   - Syncing all models (default)
   - Applying a limit to the number of models processed

2. **Simplified Stats**: Removed redundant stats tracking and replaced with concise logging:

   ```typescript
   console.log(`${modelKey}: ${endpoints.length} endpoints`)
   console.error(`Error syncing ${modelKey}:`, error)
   ```

3. **Renamed Transform Functions**:

   - `apiModelToDbModel` → `transformOrModel`
   - `apiEndpointToDbEndpoint` → `transformOrEndpoint`

4. **Improved Model/Endpoint Handling**:
   - Uses `getModelEndpoints` for batch endpoint checks
   - Properly handles `insert` vs. `replace` for both models and endpoints

### Learnings

- **Avoid Nested Actions**: Calling an action from another action is a bad practice in Convex. Instead, consolidate logic into a single action.
- **Logging Over Stats**: For background sync tasks, logging is often more useful than tracking granular stats.
- **Type Safety**: Ensure `replace` mutations include all required fields (e.g., `_creationTime`). Use spread to merge existing and updated documents:
  ```typescript
  await ctx.runMutation(internal.models.replaceModel, { ...existingModel, ...model })
  ```

### Future Considerations

- **Error Recovery**: Add retry logic for failed model syncs.
- **Batching**: Explore batching endpoints for very large models to avoid timeouts.
