# OpenRouter API Notes

## Overview

This document tracks unusual behaviors, inconsistencies, and open questions about the OpenRouter API. These notes help maintain our understanding of how to properly integrate with and interpret data from OpenRouter.

## Pricing

- `webSearch` and `request` both appear to relate to web searches, but their exact difference is unclear
- Models using `webSearch` pricing:
  - perplexity/sonar-reasoning-pro: $0.005
  - perplexity/sonar-pro: $0.005
  - perplexity/sonar-deep-research: $0.005
- Models using `request` pricing:
  - openai/gpt-4o-mini-search-preview: $0.0275
  - openai/gpt-4o-search-preview: $0.035
  - perplexity/sonar-reasoning: $0.005
  - perplexity/sonar: $0.005
  - perplexity/llama-3.1-sonar-small-128k-online: $0.005
  - perplexity/llama-3.1-sonar-large-128k-online: $0.005

## Mancer

- There are two Mancer providers in the API: "Mancer" and "Mancer 2"
- Both are the same inference service but with different data usage policies
- "Mancer" has a 25% discount because they use your input data for training new models
- "Mancer 2" lacks the discount and has higher prices, but won't store your data (labeled as "Mancer (private)" on the site)
- Oddly, the "Mancer" endpoint is no longer visible on the OpenRouter site
  - Need to check with OpenRouter Discord if this is intentional or an error
  - Abnormal for an endpoint to appear in the API but not on the site

## Modalities

- All models accept "text" as an input modality
- Many models can process multiple input modalities:
  - Text (universal)
  - Image (common in multimodal models)
  - File (less common, primarily in high-end models like GPT-4o, Gemini, Claude)
- All models produce only "text" as output
- No models were found with non-text output capabilities
- No models were found that don't accept text input

## Outstanding Questions

- What's the exact difference between `webSearch` and `request` pricing models?
- Is the "Mancer" provider being phased out, or is this a display error on the site?

## Entities

- **Provider**: Represents an entity that offers access to AI models (e.g., OpenAI, Anthropic, Google). They have specific data policies, features (like chat completions), and may host multiple model endpoints.
- **Model**: Represents a specific AI model architecture or family (e.g., GPT-4, Claude 3 Opus, Llama 4 Scout). It has inherent characteristics like context length, input/output modalities, and a description. A single model can be offered by multiple providers through different endpoints.
- **Endpoint**: Represents a specific instance or deployment of a Model by a Provider. It has its own pricing, context length (which can sometimes differ from the base model's advertised length), performance statistics, and specific capabilities (e.g., quantization, supported parameters).

## Frontend API

- https://openrouter.ai/api/frontend/models
- https://openrouter.ai/api/frontend/all-providers
- https://openrouter.ai/api/frontend/stats/endpoint?permaslug=meta-llama/llama-4-scout-17b-16e-instruct&variant=standard

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
