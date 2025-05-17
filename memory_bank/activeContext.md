# Active Context

## Current Focus

- Enhancing the model listing and detail pages with additional features
- Improving data visualization for pricing and model capabilities
- Adding filtering and sorting capabilities to the model list
- Preparing for automated data synchronization with OpenRouter
- Documenting OpenRouter API oddities and behavior

## Recent Changes

- Refined display of model information with clear organization of data
- Added specialized pricing formatters for different pricing types (per-million, per-thousand, flat)
- Added OpenRouter and HuggingFace external links to model detail pages
- Created proper handling for free models in pricing display
- Improved model layout with prominent display of modelKey
- Fixed timestamp formatting to properly handle Unix seconds
- Improved price formatting to show appropriate units based on price type
- Created documentation for OpenRouter API oddities in notes/openrouter.md
- Updated ModelPage component to show special features (image, file) instead of redundant modalities
- Changed model routes to use catch-all for handling modelKeys with slashes

## Next Steps

- Implement filtering and search functionality for the model list
- Add sorting options for different model attributes
- Create automated synchronization with OpenRouter API
- Improve loading states and error handling
- Build visual comparison tools for model capabilities
- Add client-side caching for better performance
- Continue improving model feature tags and categorization

## Current Blockers

- None identified yet

## Notes

- The basic UI for model listing and details is now complete
- Different pricing types need different formatting approaches:
  - Prompt/completion prices shown per million tokens
  - Image/request prices shown per thousand tokens
  - Web search prices shown as flat rates
  - Discount shown as raw value (possibly percentage)
- Model timestamps from OpenRouter are in Unix seconds and need conversion
- Free models (with ':free' suffix) should be clearly identified
- Model keys are critical identifiers and should be prominently displayed
- External links to model documentation improve user experience
- All models support text input/output, so we only display special capabilities like image or file input
- Models with webSearch or request pricing are related to web search capabilities (the difference is documented in notes/openrouter.md)
- Mancer providers have a 25% discount when they can use your data for training
