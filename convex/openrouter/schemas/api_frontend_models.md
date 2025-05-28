# Frontend Models API

**Endpoint**: `/api/frontend/models`

This endpoint returns an array of model objects representing AI models available through OpenRouter.

## Model Record Schema

- `slug`: (string) **canonical identifier** Base model identifier shared across variants
- `hf_slug`: (string | null) Hugging Face model identifier
- `updated_at`: (string) ISO 8601 timestamp when model was last updated in OpenRouter
- `created_at`: (string) ISO 8601 timestamp when model was first added to OpenRouter
- `hf_updated_at`: (null) **pruned** Always null, no Hugging Face update tracking
- `name`: (string) Full display name of the model
- `short_name`: (string) Abbreviated display name, typically without author prefix
- `author`: (string) **foreign key** Model author or organization slug
- `description`: (string) Detailed description of model capabilities and characteristics
- `model_version_group_id`: (string | null) **?**
- `context_length`: (number) Native context length (endpoints may vary)
- `input_modalities`: (array of strings) Supported input types (`text`, `image`, `file`)
- `output_modalities`: (array of strings) Supported output types (always `text`)
- `has_text_output`: (true) **pruned**
- `group`: (string) Model family categorization (e.g., "GPT", "Claude", "Llama")
- `instruct_type`: (string | null) Instruction format type
- `default_system`: (null) **pruned**
- `default_stops`: (array of strings) Default stop sequences for generation
- `hidden`: (true) Always true, we can't see hidden models
- `router`: (null) **pruned**
- `warning_message`: (string | null) Advisory message about model usage or limitations
- `permaslug`: (string) Model revision versioned slug, required for endpoint specific API calls
- `reasoning_config`: (object | null) Configuration for reasoning tokens
  - `start_token`: (string) Token marking start of reasoning sequence
  - `end_token`: (string) Token marking end of reasoning sequence
- `features`: (object | null) Feature flags and capabilities
  - `reasoning_config`: (object, optional) Duplicate of top-level reasoning_config
- `endpoint`: (object | null) **pruned** Embedded endpoint data, validated separately

## Notes

- Models definitions are shared between endpoint variants
- `slug` is not unique across variants, take caution in using it as a unique identifier across domains, eg. `openai/gpt-4o`
- `permaslug` provides version-specific identification, eg. `openai/gpt-4o-2024-08-06`
- All models currently output only text, making `output_modalities` always `["text"]`
- All models can read text, meaning `input_modalities` always includes `["text"]`
- The presence of `reasoning_config` indicates that the model supports reasoning/thinking
