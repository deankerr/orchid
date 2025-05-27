# OpenRouter API Notes

## Modalities

- All models accept "text" as an input modality
- Many models can process multiple input modalities:
  - Text (universal)
  - Image (common in multimodal models)
  - File (less common, primarily in high-end models like GPT-4o, Gemini, Claude)
- All models produce only "text" as output
- No models were found with non-text output capabilities
- No models were found that don't accept text input

## Entities

- **Provider**: Represents an entity that offers access to AI models (e.g., OpenAI, Anthropic, Google). They have specific data policies, features (like chat completions), and may host multiple model endpoints.
- **Model**: Represents a specific AI model architecture or family (e.g., GPT-4, Claude 3 Opus, Llama 4 Scout). It has inherent characteristics like context length, input/output modalities, and a description. A single model can be offered by multiple providers through different endpoints.
- **Endpoint**: Represents a specific instance or deployment of a Model by a Provider. It has its own pricing, context length (which can sometimes differ from the base model's advertised length), performance statistics, and specific capabilities (e.g., quantization, supported parameters).

## Identifiers

- The primary identifier for a model that we use is:
  - The `id` field of the `model` object from `/api/v1/models`
  - Also found as `model_variant_slug` from the endpoint object from `/api/frontend/stats/endpoint`
  - Identifiers are not guaranteed to be unique, but they are unique within a given model.
  - This identifier is used to view the model page on OpenRouter at `https://openrouter.ai/<identifier>`, and as the model id to make an inference request.
  - Separately, these values are found as the `slug` and `variant` fields from the model object from `/api/frontend/models`.
  - Examples: `openai/gpt-4.1`, `anthropic/claude-3-sonnet:beta`, `mistralai/mistral-small`, `meta-llama/llama-3.1-8b-instruct`, `meta-llama/llama-3.1-8b-instruct:free`
- Some endpoints require using the `permaslug` field from the model, listed on the model object from `/api/frontend/models`, as well as the `variant` field.
  - The `permaslug` and `variant` combined can be found on the `endpoint` object as `model_variant_permaslug`, but you can't discover this object without already knowing these values.
  - For most models, `slug` and `permaslug` are identical.
  - When they differ, this is usually a model from a major vendor that creates revisions/updates of that model, eg. OpenAI's incremental updates to GPT-4.1.
  - But it's very inconsistent, and there is no way to reliably reason about when it will actually differ. It should be treated as an opaque value for the purpose of querying the requiring API endpoints only.
  - Examples: `openai/gpt-4.1-2025-04-14`, `anthropic/claude-3-sonnet`, `mistralai/mistral-small`, `meta-llama/llama-3.1-8b-instruct`, `meta-llama/llama-3.1-8b-instruct`
  - As you can see, these are NOT a unique identifier for a model.
- Variants include `free`, `beta`, `thinking`, `extended`.
  - While they ultimately refer to a same base model, they are essentially different "models", in that they have different endpoints, pricing, behaviour, etc.
  - This is why the combination of `slug` and `variant` is used as the primary identifier for a model.
  - Variants are never mixed within a model - ie. all endpoints from a model share the same variant property.
  - `free` is the most common, and notable because it's not necessarily a "positive" trait - all `free` variants data policies state in some form that the providers will store your data, and use it for training, or any other purpose.

## Frontend API

- https://openrouter.ai/api/frontend/models
- https://openrouter.ai/api/frontend/all-providers
- https://openrouter.ai/api/frontend/stats/endpoint?permaslug=meta-llama/llama-4-scout-17b-16e-instruct&variant=standard
  - variant is optional if "standard"
  - if there are no endpoints available, it will return a 404 error object, even if the model exists
  - stats: computed p50 values?

### Undocumented

- https://openrouter.ai/api/frontend/model-author?authorSlug=liquid&shouldIncludeStats=true&shouldIncludeVariants=false

  - author object. canonical name, description?
  - modelsWithStats array - Model with Endpoint (with internal Model again?)
    - stats: daily token input/output totals, 'count' = requests?
    - despite the param, always seems to include stats

- https://openrouter.ai/api/frontend/models/versions?permaslug=liquid%2Flfm-7b&variant=standard

  - So far, only this object has been observed, with no values contained: `{ "models": [], "analytics": [] }`

- https://openrouter.ai/api/frontend/stats/app?limit=20&permaslug=liquid%2Flfm-7b&variant=standard

  - "Top public apps this week using this model"

- https://openrouter.ai/api/frontend/stats/uptime-recent?permaslug=liquid%2Flfm-7b

  - Map of endpoint UUIDs to uptime data (last 3 days)
  - Doesn't take a variant parameter, always has every variant's data included

- https://openrouter.ai/api/frontend/stats/uptime-hourly?id=25b2cca5-53f6-40e7-b47b-191ec968b7c2

  - Last 72 hours of uptime data for an endpoint

## Frontend API Sample Schemas

- `[?]` indicates an assumption has been made about its type or purpose, variants may exist
- `[x]` indicates a useless/unreliable property that doesn't contain the expected data, or is always nullish/empty

### `all-providers.json`

This file contains an array of provider objects. Each object has the following schema:

- `name`: (string) The internal/API name of the provider.
- `displayName`: (string) The user-facing display name of the provider.
- `slug`: (string) A URL-friendly slug for the provider.
- `baseUrl`: (string) Value is always "url". [X]
- `dataPolicy`: (object) Contains information about the provider's data handling policies.
  - `privacyPolicyURL`: (string) URL to the provider's privacy policy.
  - `termsOfServiceURL`: (string) URL to the provider's terms of service.
  - `dataPolicyUrl`: (string | null, optional) URL to a more specific data policy document.
  - `paidModels`: (object) Describes data handling for paid models.
    - `training`: (boolean) Whether data from paid models is used for training.
    - `retainsPrompts`: (boolean, optional) Whether the provider retains prompts.
    - `retentionDays`: (number, optional) Number of days prompts are retained if `retainsPrompts` is true.
  - `requiresUserIDs`: (boolean, optional) Whether user IDs are required for this provider.
- `headquarters`: (string, optional) Two-letter country code for the provider's headquarters.
- `hasChatCompletions`: (boolean) Whether the provider supports chat-style completions.
- `hasCompletions`: (boolean) Whether the provider supports legacy-style completions.
- `isAbortable`: (boolean) Whether requests to this provider can be aborted.
- `moderationRequired`: (boolean) Whether input to this provider requires moderation.
- `editors`: (array) Always empty. [X]
- `owners`: (array) Always empty. [X]
- `isMultipartSupported`: (boolean) Whether the provider supports multipart requests.
- `statusPageUrl`: (string | null, optional) URL to the provider's status page.
- `byokEnabled`: (boolean) Bring Your Own Key enabled.
- `icon`: (object, optional) Information about the provider's icon.
  - `url`: (string) URL of the icon image (Required if `icon` object is present).
  - `invertRequired`: (boolean, optional) Whether the icon color needs to be inverted for display [?].

### `endpoint-(llama-4-scout).json`

This file contains an array of endpoint objects for a specific model. Each object represents a provider's offering of that model and has the following schema:

- `id`: (string) A unique identifier for this specific endpoint.
- `name`: (string) A descriptive name for the endpoint.
- `context_length`: (number) The context length supported by this specific endpoint.
- `model`: (object) _The schema for this object is the same as described in `models.json`._
- `model_variant_slug`: (string) Slug of the model variant.
- `model_variant_permaslug`: (string) Permanent slug of the model variant.
- `provider_name`: (string) The internal/API name of the provider.
- `provider_info`: (object) _This object has the same schema as described in `all-providers.json`._
- `provider_display_name`: (string) The user-facing display name of the provider.
- `provider_model_id`: (string) The provider's internal ID for this model/endpoint.
- `provider_group`: (string, optional) A grouping for the provider [?].
- `quantization`: (string | null) The quantization level of the model at this endpoint.
- `variant`: (string) The variant type of the endpoint.
- `is_free`: (boolean) Whether this endpoint is offered for free.
- `can_abort`: (boolean) Whether requests to this specific endpoint can be aborted.
- `max_prompt_tokens`: (number | null) Maximum number of prompt tokens allowed.
- `max_completion_tokens`: (number | null) Maximum number of completion tokens allowed.
- `max_prompt_images`: (number | null) Maximum number of images allowed in the prompt.
- `max_tokens_per_image`: (number | null) Maximum tokens allocated per image [?].
- `supported_parameters`: (array of strings) List of API parameters supported by this endpoint.
- `is_byok`: (boolean) Whether this endpoint is Bring Your Own Key [?].
- `moderation_required`: (boolean) Whether input to this endpoint requires moderation.
- `data_policy`: (object) Data policy specific to this endpoint/provider combination. _This object generally mirrors the structure of `dataPolicy` found in `all-providers.json` (containing `termsOfServiceURL`, `privacyPolicyURL`, `dataPolicyUrl` (optional string), `paidModels` object, and `requiresUserIDs` (optional boolean)). It can also sometimes include additional top-level boolean fields like `training` or `retainsPrompts` and `retentionDays` (number) that might override or specify further details for this specific endpoint._
- `pricing`: (object) Pricing details for this endpoint.
  - `prompt`: (string) Cost per prompt token.
  - `completion`: (string) Cost per completion token.
  - `image`: (string) Cost related to image processing.
  - `request`: (string) Cost per request.
  - `web_search`: (string) Cost for web search capabilities.
  - `input_cache_read`: (string, optional) Cost related to reading from input cache [?].
  - `internal_reasoning`: (string) Cost for internal reasoning [?].
  - `discount`: (number) Discount percentage applied.
- `variable_pricings`: (array) [?] Array for variable pricing structures (Always present, can be empty).
- `is_hidden`: (boolean) Whether this endpoint is hidden.
- `is_deranked`: (boolean) Whether this endpoint is de-ranked in listings.
- `is_disabled`: (boolean) Whether this endpoint is currently disabled.
- `supports_tool_parameters`: (boolean) Whether the endpoint supports tool parameters.
- `supports_reasoning`: (boolean) Whether the endpoint supports reasoning capabilities.
- `supports_multipart`: (boolean) Whether the endpoint supports multipart requests.
- `limit_rpm`: (number | null) Rate limit in requests per minute.
- `limit_rpd`: (number | null) Rate limit in requests per day.
- `limit_rpm_cf`: (number | null) Rate limit in requests per minute for Cloudflare [?].
- `has_completions`: (boolean) Whether this endpoint supports legacy-style completions.
- `has_chat_completions`: (boolean) Whether this endpoint supports chat-style completions.
- `features`: (object) Additional features for this endpoint (Always present).
- `supported_parameters`: (object) [?] Breakdown of supported parameters (Always present, can be empty {}).
- `supports_document_url`: (string | null) [?].
- `provider_region`: (string | null) The region where the provider hosts this endpoint.
- `stats`: (object, optional) Performance statistics for the endpoint.
  - `endpoint_id`: (string) The ID of the endpoint.
  - `p50_throughput`: (number) Median throughput.
  - `p50_latency`: (number) Median latency.
  - `request_count`: (number) Number of requests.
- `status`: (number) Status code for the endpoint.

### `models.json`

This file contains an array of model objects. Each object has the following schema:

- `slug`: (string) The OpenRouter slug for the model.
- `hf_slug`: (string) The Hugging Face slug for the model (can be an empty string).
- `updated_at`: (string) ISO 8601 timestamp of when the model was last updated in OpenRouter.
- `created_at`: (string) ISO 8601 timestamp of when the model was created in OpenRouter.
- `hf_updated_at`: Always null. [X]
- `name`: (string) Full display name of the model.
- `short_name`: (string) A shorter display name for the model.
- `author`: (string) The author or organization behind the model.
- `description`: (string) A detailed description of the model.
- `model_version_group_id`: (string | null) Identifier for a model version group. [?]
- `context_length`: (number) The maximum context length advertised for the base model.
- `input_modalities`: (array of strings) List of input modalities supported.
- `output_modalities`: (array of strings) List of output modalities supported.
- `has_text_output`: (boolean) Whether the model has text output.
- `group`: (string) A grouping category for the model (e.g., "GPT", "Llama3", "Other").
- `instruct_type`: (string | null) The instruction format type [?].
- `default_system`: Always null. [X]
- `default_stops`: (array of strings) Default stop sequences (Always present, can be empty).
- `hidden`: (boolean) Whether the model is hidden in listings.
- `router`: Always null. [X]
- `warning_message`: (string | null) Any warning message associated with the model.
- `permaslug`: (string) A permanent slug for the model.
- `reasoning_config`: (object | null) 'think' start_token and end_token
- `features`: (object) Contains reasoning_config if it is present, otherwise empty object
- `endpoint`: (object | null) Represents a default or featured endpoint for this model. _The schema for this object is the same as described in `endpoint-(llama-4-scout).json` above._
