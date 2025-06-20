# ORCHID Entity Reference

This document describes each entity type in ORCHID, how OpenRouter exposes them, and how we transform them for our use.

## Model Identifiers

Understanding how models are identified in OpenRouter is crucial for working with the ORCHID system. Models use three key concepts: slug, permaslug, and variant.

### Definitions

#### Slug (Model)
- **Definition**: A human-readable identifier for a model
- **Format**: Lowercase, hyphen-separated (e.g., `gpt-4`, `deepseek/deepseek-r1`, `mistral-large`)
- **Purpose**: Points to the latest version of a model
- **Example**: `claude-3-5-sonnet`

#### Permaslug (Model)
- **Definition**: A versioned, permanent identifier that includes date/version information
- **Format**: `{slug}-{version-id}` (e.g., `gpt-4-2024-05-13`)
- **Purpose**: Always refers to a specific version, even after model updates
- **Example**: `claude-3-5-sonnet-20241022`
- **Note**: For the vast majority of models, the slug and permaslug are the same

#### Variant (Model)
- **Definition**: Different configurations or deployments of the same model
- **Format**: String identifier (e.g., `standard`, `free`, `beta`, `thinking`)
- **Purpose**: Distinguishes between different offerings of the same model
- **Example**: Model `deepseek-r1` has variants `standard` and `free`
- **Note**: The `standard` variant tag is omitted for end users and only exists internally

### How End Users Specify Models

When making inference requests, users can specify models in several ways:

**Latest version, standard variant:**
```
model: "anthropic/claude-3.5-sonnet"
```
- Uses slug only
- Points to the latest version
- Most common usage pattern
- Model may be updated over time

**Specific version, standard variant:**
```
model: "anthropic/claude-3.5-sonnet-20241022"
```
- Uses permaslug
- Locked to specific version
- Never changes

**Latest version, non-standard variant:**
```
model: "anthropic/claude-3.5-sonnet:thinking"
```
- Format: `{slug}:{variant}`
- Latest version with thinking mode
- Variant explicitly specified

**Specific version, non-standard variant:**
```
model: "anthropic/claude-3.5-sonnet-20241022:thinking"
```
- Format: `{permaslug}:{variant}`
- Locked version with thinking mode
- Most specific form

### Internal Processing

ORCHID processes these identifiers as follows:

1. **Model Consolidation**: OpenRouter returns separate entries for each variant, but ORCHID consolidates them into a single model with a `variants` array

2. **Variant Storage**: We store all variants including `standard`, even though it's hidden from end users

3. **API Requests**: When fetching data for endpoints, apps, etc., we iterate through each model variant using the format `{permaslug}` and `{variant}` as separate parameters

### Other Entity Identifiers

While models use the slug/permaslug/variant system, other entities use different identifiers:

- **Providers**: Use slugs (e.g., `azure`, `together-ai`)
- **Endpoints**: Use UUIDs as primary keys
- **Authors**: Use both UUIDs (primary key) and slugs (e.g., `openai`, `anthropic`)
- **Apps**: Use numeric IDs

## Entity Types

### 1. Models

**What it represents**: AI models available through OpenRouter (GPT-4, Claude, Llama, etc.)

**OpenRouter API**: `/api/frontend/models`

**Key fields**:
- `slug`: Primary identifier (e.g., `gpt-4`)
- `permaslug`: Versioned identifier (e.g., `gpt-4-2024-05-13`)
- `name`: Display name (e.g., "GPT-4")
- `author`: Creator organization (e.g., "OpenAI")
- `context_length`: Maximum tokens the model can process
- `input_modalities`: What the model accepts (`["text"]`, `["text", "image"]`)
- `variants`: Array of available configurations

**Our transformation**:
- Consolidate duplicate entries by variant into single model with variant array
- Convert timestamps to epoch milliseconds
- Map `author` → `author_slug`
- Map `group` → `tokenizer` (architecture family)
- Extract variant information from endpoint data

**Note**: OpenRouter returns one entry per model variant, but we consolidate them into a single model entity with a `variants` array.

### 2. Providers

**What it represents**: Infrastructure providers that host AI models (Azure, AWS, Together AI, etc.)

**OpenRouter API**: `/api/frontend/all-providers`

**Key fields**:
- `slug`: Primary identifier (e.g., `azure`, `together-ai`)
- `displayName`: Human-readable name
- `headquarters`: Two-letter country/state code
- `capabilities`: What the provider supports (chat, completions, multipart, etc.)
- `dataPolicy`: Privacy and data handling policies

**Our transformation**:
- Flatten capability flags into structured object
- Restructure data policy into nested format
- Map `displayName` → `name`
- Convert boolean flags to capability object

### 3. Endpoints

**What it represents**: Specific deployments of models on providers (a model + provider + region combination)

**OpenRouter API**: `/api/frontend/stats/endpoint?permaslug={model_permaslug}&variant={variant}`

**Key fields**:
- `id`: UUID primary key
- `model_variant_slug`: Combined identifier `{slug}:{variant}`
- `provider_slug`: Which provider hosts this endpoint
- `context_length`: May differ from model's base context length
- `pricing`: Cost per token/image/request
- `capabilities`: What this specific deployment supports
- `status`: Availability status (negative values = deranked)

**Our transformation**:
- Map `id` → `uuid`
- Flatten pricing to numeric values (parse string prices)
- Group capabilities into structured object
- Add model metadata (slug, permaslug) from parent model
- Extract stats into separate record if present

**Note**: Each endpoint represents a specific way to access a model. The same model might have multiple endpoints across different providers or regions.

### 4. Authors

**What it represents**: Organizations that created the models (OpenAI, Anthropic, Meta, etc.)

**OpenRouter API**: `/api/frontend/model-author?authorSlug={slug}`

**Key fields**:
- `id`: UUID
- `slug`: Primary identifier (e.g., `openai`, `anthropic`)
- `name`: Display name
- `description`: Organization description

**Our transformation**:
- Map `id` → `uuid`
- Convert timestamps to epoch milliseconds
- Extract model token stats (returned with author data)

**Note**: Author data includes aggregated token usage statistics for all their models.

### 5. Apps

**What it represents**: Applications using models through OpenRouter

**OpenRouter API**: `/api/frontend/stats/app?permaslug={model_permaslug}&variant={variant}&limit=20`

**Key fields**:
- `id`: Numeric identifier
- `title`: App name
- `origin_url`: Where the app is hosted
- `total_tokens`: Usage statistics

**Our transformation**:
- Map `id` → `app_id`
- Split into app metadata and token statistics
- Convert timestamps to epoch milliseconds

**Note**: Apps are discovered through their usage of models, so we fetch app data for each model variant.

## Statistics Tables

### Model Token Stats
- **Source**: Returned with author data
- **Granularity**: Daily aggregates per model variant
- **Fields**: Input/output/reasoning tokens, request counts

### Endpoint Stats
- **Source**: Returned with endpoint data  
- **Fields**: P50 latency/throughput, request counts
- **Purpose**: Performance metrics for each endpoint

### Endpoint Uptime Stats
- **Source**: `/api/frontend/stats/uptime-hourly?id={endpoint_uuid}`
- **Granularity**: Hourly uptime percentages
- **Purpose**: Track availability over time

### App Token Stats
- **Source**: Returned with app data
- **Granularity**: Total usage per app per model
- **Purpose**: Track which apps use which models

## Entity Relationships

```
Models (1) ←→ (N) Endpoints ←→ (1) Providers
   ↓                                    ↓
   └→ (1) Author                   Data Policies
   └→ (N) Apps
   └→ Variants[]

Endpoints generate:
- Endpoint Stats
- Endpoint Uptime Stats

Models generate (via Authors):
- Model Token Stats

Apps generate:
- App Token Stats
```

## Data Collection Flow

1. **Phase 1**: Fetch all models and providers (independent)
2. **Extract**: Get unique author slugs from models
3. **Phase 2**: For each model variant, fetch:
   - Endpoints (including stats)
   - Apps (including token usage)
   - For each endpoint, fetch uptime data
4. **Phase 2**: For each author slug, fetch:
   - Author details
   - Model token statistics

## Important Notes

1. **Variant Handling**: OpenRouter returns separate model entries for each variant, but we consolidate them. Endpoints and apps are fetched per variant.

2. **Permaslug Stability**: Permaslugs include dates to version models. When a model is updated, it gets a new permaslug but keeps the same slug.

3. **UUID Usage**: Only endpoints and authors use UUIDs as primary keys. Models, providers, and apps use slugs or numeric IDs.

4. **Stats Granularity**: Different statistics have different time granularities:
   - Model token stats: Daily
   - Endpoint uptime: Hourly  
   - Endpoint stats: Point-in-time
   - App token stats: Cumulative

5. **Data Dependencies**: Many entities can only be fetched after models are loaded because their API endpoints require model identifiers. 