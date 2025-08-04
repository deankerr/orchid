# Models API Comparison

**Official**: `/api/v1/models`  
**Private**: `/api/frontend/models`

## Common Data Points

| Field | Official API | Private API | Notes |
|-------|-------------|-------------|-------|
| Model name | `name` | `name` | Same field |
| Description | `description` | `description` | Same field |
| Context length | `context_length` | `context_length` | Same field |
| Input modalities | `architecture.input_modalities` | `input_modalities` | Different nesting |
| Output modalities | `architecture.output_modalities` | `output_modalities` | Different nesting |
| Tokenizer | `architecture.tokenizer` | `group` | Different field name |
| Instruct type | `architecture.instruct_type` | `instruct_type` | Different nesting |
| HuggingFace ID | `hugging_face_id` | `hf_slug` | Different field name |
| Model ID | `id` / `canonical_slug` | `slug` | Different field name |
| Creation time | `created` (unix timestamp) | `created_at` (ISO string) | Different format |

## Official API Exclusive Data

- `pricing` - Prompt/completion/image/request costs
- `top_provider` - Best provider info (context_length, max_completion_tokens, is_moderated)  
- `per_request_limits` - Request-based limitations

## Private API Exclusive Data

- `updated_at` - Model update timestamp
- `short_name` - Clean name without author prefix
- `author` - Separate author slug field
- `permaslug` - Versioned unique identifier
- `reasoning_config` - Thinking tokens (start_token, end_token)
- `warning_message` - Model warnings/notices
- `endpoint.variant` - Model variant information

## Key Incompatibilities

1. **No variant system** in official API
2. **No author separation** in official API  
3. **No permaslug** (critical for private system's foreign keys)
4. **No update timestamps** in official API
5. **No reasoning config** for thinking models