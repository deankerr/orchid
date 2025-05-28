# Frontend Stats Endpoint API

**Endpoint**: `/api/frontend/stats/endpoint?permaslug={permaslug}&variant={variant}`

This endpoint returns an array of endpoint objects for a specific model, representing different provider offerings of that model.

## Endpoint Record Schema

- `id`: (string) **canonical identifier** UUID
- `name`: (string) Format: `{provider_name} | {model_variant_slug}`
- `context_length`: (number) Context length supported by this specific endpoint
- `model`: (object) **pruned** Embedded model data, validated separately
- `model_variant_slug`: (string) **natural identifier** Canonical model variant identifier for this endpoint
- `model_variant_permaslug`: (string) Version-specific model variant identifier
- `provider_name`: (string) Internal/API name of the provider
- `provider_info`: (object) **pruned** Embedded provider data, validated separately
- `provider_display_name`: (string) User-facing provider display name
- `provider_slug`: (string) **foreign key** Provider identifier
- `provider_model_id`: (string) Provider's internal ID for this model
- `quantization`: (string | null) Model quantization level (e.g., "fp16", "int8")
- `variant`: (string) Endpoint variant type (e.g., "standard", "free", "thinking", "extended")
- `is_free`: (boolean) variant = free
- `can_abort`: (boolean) supports stream cancellation
- `max_prompt_tokens`: (number | null) Maximum tokens allowed in prompts
- `max_completion_tokens`: (number | null) Maximum tokens allowed in completions
- `max_prompt_images`: (number | null) Maximum images allowed in prompts
- `max_tokens_per_image`: (number | null) Token allocation per image in prompts
- `supported_parameters`: (array of strings) API parameters supported by this endpoint
- `is_byok`: (boolean) supports Bring Your Own Key
- `moderation_required`: (boolean) Provider requires that OpenRouter perform moderation on input before processing
- `data_policy`: (object) **TODO** - Data handling policies specific to this endpoint
- `pricing`: (object) Cost structure for this endpoint
  - `prompt`: (string) Text input
  - `completion`: (string) Text output
  - `image`: (string) Image tokens
  - `request`: (string) Web search related
  - `web_search`: (0) **pruned** always zero, OpenRouter frontend related
  - `input_cache_read`: (string, optional)
  - `input_cache_write`: (string, optional)
  - `internal_reasoning`: (string, optional)
  - `discount`: (0) **pruned** deprecated
- `variable_pricings`: (unknown[]) **TODO** web search related
- `is_hidden`: (true) **pruned**
- `is_deranked`: (boolean) Unlikely that your requests will be routed to this endpoint
- `is_disabled`: (boolean) Endpoint is hidden from OpenRouter frontend and non-routable
- `supports_tool_parameters`: (boolean) supports function calling/tools
- `supports_reasoning`: (boolean) supports reasoning capabilities
- `supports_multipart`: (boolean) supports multipart messages, ie. text + image/file components
- `limit_rpm`: (number | null) Rate limit in requests per minute
- `limit_rpd`: (number | null) Rate limit in requests per day
- `limit_rpm_cf`: (number | null) Cloudflare-specific rate limit in requests per minute
- `has_completions`: (boolean) supports legacy completions API
- `has_chat_completions`: (boolean) supports chat completions API
- `features`: (object) Additional endpoint capabilities
  - `supported_parameters`: (object, optional) Detailed parameter support
    - `response_format`: (boolean, optional) Supports structured response formats
    - `structured_outputs`: (boolean, optional) Supports structured output schemas
  - `supports_document_url`: (null) **pruned** Always null, no document URL support
- `provider_region`: (string | null) Geographic region where provider hosts this endpoint
- `stats`: (object, optional) Performance statistics for the endpoint
  - `endpoint_id`: (string) same UUID as `id`
  - `p50_throughput`: (number) Median throughput in tokens per second
  - `p50_latency`: (number) Median latency in milliseconds
  - `request_count`: (number) **TODO** Total number of requests processed?
- `status`: (number, optional) Endpoint health status (0 = healthy, negative values indicate issues)

## Pricing

- prompt/completion/image/input_cache_read/input_cache_write/internal_reasoning are dollars per token (very small)
- prompt/completion/input_cache_read/input_cache_write/internal_reasoning should be rendered as $/million tokens
- image should be rendered as $/thousand tokens
- request is a flat rate, rendered as is

## Notes

- `is_disabled` being true is extremely uncommon, this endpoint is essentially dead
