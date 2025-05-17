# System Patterns

## Architecture Overview

ORCHID follows a modern web application architecture:

- Next.js for the frontend and API routes
- Convex for backend database and real-time updates
- shadcn/ui for UI components

## Data Flow

1. **Data Collection**: Scheduled jobs fetch model/provider data from OpenRouter API
2. **Data Processing**: Raw data is processed and enriched before storage
3. **Storage**: Structured data is stored in Convex database
4. **Retrieval**: Frontend queries data through Convex client
5. **Visualization**: Data is presented through configurable UI components

## Frontend Patterns

### Component Organization

- **Page Components**: Top-level components for routes (e.g., ModelPage)
- **UI Components**: Reusable interface elements (cards, buttons, etc.)
- **Display Components**: Purpose-built for specific data types (ModelCard, ModelList)

### Data Formatting

- **Utils Module Pattern**: Centralized formatting logic in utils.ts files
- **Type-Specific Formatters**: Specialized formatting functions for different data types:
  - `formatPricePerM` for per-million token pricing
  - `formatPricePerK` for per-thousand token pricing
  - `formatFlatPrice` for single-value prices
  - `formatContextLength` for token quantities
  - `formatTimestamp` for date/time values
- **Conditional Formatting**: Display logic based on data properties (e.g., free models)

### Data Access Pattern

- **Paginated Queries**: Using Convex's usePaginatedQuery for efficient data loading
- **Single-Item Queries**: Using standard useQuery for detailed lookups
- **Model-Endpoint Relationship**: Single query fetches model with associated endpoints

## Architecture Patterns

- **Functional Service Modules**: Self-contained modules for specific functionality (model fetching, data processing)
- **Custom Hooks**: React hooks for data access and state management
- **Server Functions**: Convex functions for backend operations

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
- `huggingFaceId`: Optional ID for HuggingFace model repository

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
  - `prompt`: Cost per input token (displayed per million tokens)
  - `completion`: Cost per output token (displayed per million tokens)
  - `image`: Cost for image processing (displayed per thousand tokens)
  - `request`: Request-based cost (displayed per thousand tokens)
  - `webSearch`: Web search cost (displayed as flat price)
  - Other pricing parameters as needed

### Indexes

- `by_modelKey`: For model lookup
- `by_providerName`: For provider filtering

## API Approach

For data synchronization with OpenRouter:

- `transforms.ts`: Utility functions to convert API responses to DB schema
- `importModel` / `importEndpoint`: Internal mutations to create/update records
- `syncModels`: Action to sync a single model and its endpoints

For data retrieval:

- `findEndpointsByCapabilities`: Query to filter endpoints by specific capabilities
- `getModelByKey` / `getEndpointByModelAndProvider`: Queries to check existence
- `listModelsWithEndpoints`: Paginated query for model listing with endpoints

## UI Design Patterns

- **Card Pattern**: Consistent card UI for displaying model information
- **Progressive Disclosure**: Summary in listings, details on dedicated pages
- **Responsive Layout**: Grid-based layouts that adapt to different screen sizes
- **Visual Hierarchy**: Prominent display of key identifiers (model keys)
- **External Resources**: Links to external documentation and resources

## Error Handling

Areas to consider:

- How should we handle OpenRouter API failures?
- What logging approach should we implement?
- How will errors be presented to users?

## Learnings

- **Avoid Nested Actions**: Calling an action from another action is a bad practice in Convex. Instead, consolidate logic into a single action.
- **Logging Over Stats**: For background sync tasks, logging is often more useful than tracking granular stats.
- **Type Safety**: Ensure `replace` mutations include all required fields (e.g., `_creationTime`). Use spread to merge existing and updated documents:
  ```typescript
  await ctx.runMutation(internal.models.replaceModel, { ...existingModel, ...model })
  ```
- **Data Formatting**: Different data types require specialized formatting for user readability:
  - Prices per token are too small for direct display and need scaling
  - Different pricing models need different units and scaling
  - Timestamps need conversion from Unix seconds to JavaScript milliseconds

## Future Considerations

- **Error Recovery**: Add retry logic for failed model syncs.
- **Batching**: Explore batching endpoints for very large models to avoid timeouts.
- **Client Caching**: Add client-side caching for common queries.
- **Advanced Filtering**: Implement complex filtering based on model capabilities.
