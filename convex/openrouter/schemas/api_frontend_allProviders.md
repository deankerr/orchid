# Frontend All Providers API

**Endpoint**: `/api/frontend/all-providers`

This endpoint returns an array of provider objects representing AI service providers available through OpenRouter.

## Provider Record Schema

- `name`: (string) Internal name, should likely be pruned
- `displayName`: (string) User-facing display name
- `slug`: (string) **canonical identifier** URL-friendly identifier for the provider
- `baseUrl`: (string) **pruned** Always contains "url", provides no meaningful value
- `dataPolicy`: (object) **TODO** - Data handling policies and requirements
- `headquarters`: (string, optional) Two-letter country code for provider headquarters
- `hasChatCompletions`: (boolean) supports chat-style completions
- `hasCompletions`: (boolean) supports legacy-style completions
- `isAbortable`: (boolean) Whether requests to this provider can be aborted
- `moderationRequired`: (boolean) Provider requires that OpenRouter perform moderation on input before processing
- `editors`: (array) **pruned** Always empty, no observed useful data
- `owners`: (array) **pruned** Always empty, no observed useful data
- `isMultipartSupported`: (boolean) supports multipart messages, ie. text + image/file components
- `statusPageUrl`: (string | null) URL to provider's status page
- `byokEnabled`: (boolean) Whether Bring Your Own Key is supported
- `icon`: (object) Provider icon information
  - `url`: (string) URL of the icon image
  - `invertRequired`: (boolean, optional) Whether icon requires color inversion for display
