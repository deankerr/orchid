# Endpoints API Comparison

**Official**: `/api/v1/models/{id}/endpoints`  
**Private**: `/api/frontend/stats/endpoint?permaslug={permaslug}&variant={variant}`

## Common Data Points

| Field | Official API | Private API | Notes |
|-------|-------------|-------------|-------|
| Endpoint name | `name` | `name` | Same field |
| Context length | `context_length` | `context_length` | Same field |
| Max completion tokens | `max_completion_tokens` | `max_completion_tokens` | Same field |
| Moderation required | `is_moderated` | `moderation_required` | Different field name |
| Supported parameters | `supported_parameters` | `supported_parameters` | Same field |
| Basic pricing | `pricing.{prompt,completion,image,request}` | `pricing.{prompt,completion,image,request}` | Same structure |

## Official API Exclusive Data

- `endpoint_url` - Direct API endpoint URL
- `api_key_required` - Whether API key is needed

## Private API Exclusive Data

### Critical System Fields
- `id` - UUID (primary key)
- `provider_info.slug` - Provider reference (foreign key)
- `model_variant_permaslug` - Model reference (foreign key)
- `quantization` - Model quantization type
- `variant` - Model variant name
- `status` - Derank status (negative = deranked)
- `is_disabled` - Availability status

### Capability Flags
- `can_abort` - Stream cancellation support
- `is_byok` - Bring your own key support
- `supports_tool_parameters` - Tool calling support
- `supports_reasoning` - Reasoning mode support
- `supports_multipart` - Multipart message support
- `has_completions` - Text completion API support
- `has_chat_completions` - Chat completion API support

### Rate Limits
- `limit_rpm` - Requests per minute limit
- `limit_rpd` - Requests per day limit
- `max_prompt_tokens` - Input token limit
- `max_prompt_images` - Image input limit
- `max_tokens_per_image` - Tokens per image limit

### Extended Pricing
- `pricing.web_search` - Web search cost
- `pricing.input_cache_read` - Cache read cost
- `pricing.input_cache_write` - Cache write cost
- `pricing.internal_reasoning` - Reasoning token cost
- `pricing.discount` - Applied discount percentage
- `variable_pricings` - Dynamic pricing rules

### Data Policy
- `data_policy.training` - Used for training
- `data_policy.retainsPrompts` - Prompt retention
- `data_policy.retentionDays` - Retention period
- `data_policy.requiresUserIDs` - User ID requirements
- `data_policy.canPublish` - Publishing permissions

### Performance Stats (Optional)
- `stats.p50_throughput` - Median throughput
- `stats.p50_latency` - Median latency
- `stats.request_count` - Total requests

### Separate Uptime API
- `/api/frontend/stats/uptime-hourly?id={uuid}` - 72h uptime history (not available in official API)

## Key Incompatibilities

1. **No UUID system** - Official API has no endpoint identifiers
2. **No provider structure** - Can't maintain provider relationships
3. **No uptime data** - Critical availability tracking missing
4. **Limited capabilities** - Missing 7+ boolean capability flags
5. **No rate limits** - Missing operational constraints
6. **No data policy** - Missing governance information
7. **No performance stats** - Missing monitoring data