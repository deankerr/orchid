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

### API Endpoints

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

## Assumptions we should test

- Request limits are always null (vestigial)
- Status < 0 = deranked, status <= -10 = disabled
