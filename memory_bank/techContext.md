# Technical Context

## Technology Stack

- **Frontend**: Next.js, React, TypeScript
- **UI Components**: shadcn/ui (based on Radix UI)
- **Backend/Database**: Convex
- **Package Management**: bun
- **Styling**: Tailwind CSS
- **Testing**: Vitest (frontend), Convex testing utilities (backend) [?]

## Development Environment

- Node.js environment with bun as package manager
- Git for version control
- VSCode as recommended editor with TypeScript and ESLint extensions [?]

## External Dependencies

- **OpenRouter API**: Primary data source for model/provider information
- **shadcn/ui**: Component library for rapid UI development
- **Tailwind CSS**: Utility-first CSS framework
- **Convex**: Backend-as-a-Service for database and real-time functionality

## Coding Standards [?]

- TypeScript for type safety
- Functional components with React hooks
- Composable functions over class hierarchies
- Tailwind for styling following utility-first approach
- ESLint for code quality enforcement

## Infrastructure [?]

- Vercel for frontend hosting
- Convex for backend hosting and database

## API Integrations

- **OpenRouter API**: Used for fetching model and provider data
  - Endpoints for model listing [?]
  - Endpoints for provider information [?]
  - Endpoints for model testing and evaluation [?]

## Technical Constraints

- What are the OpenRouter API rate limits?
- How often is OpenRouter API data updated?
- Are there any Convex-specific limitations we should be aware of?
- What are the performance considerations for data visualization?

## Performance Considerations [?]

- Efficient data fetching and caching
- Optimized database queries
- Lazy loading and code splitting
- Server-side rendering for critical pages

## Security Approach

- How should API keys be managed?
- What credential handling approach should we use?
- What input validation and sanitization methods should we implement?

## Monitoring and Logging [?]

- Application performance monitoring
- Error tracking and reporting
- Usage analytics for feature optimization
