# backend

## custom entity data

- e.g. our own description of models, guides, notes/messages about providers, benchmarks pulled from other APIs etc.
- distinct from `or_*` tables, persisted
- related by slug
- flexible structure, frontend can interpret as required

### Artificial Analysis API

- provides various benchmark scores for major models
- cron action to collect and store data
- may need slug/id normalization

## OR entity changes tracking

- [X] generate diffs of archive data
- refine diffs to show e.g. pricing changes

# frontend

- our current endpoint data table may be kept as an advanced "show everything" table, but many elements are rare

## supported parameters explorer

- per model, supported params can vary
- rather than just listing all params for each endpoint, design a more intuitive way to see the differences

## API

- consider caching results in localStorage

# convex notes

- our public endpoints are for our frontend only. we can easily reconfigure them as desired to make any work on the frontend easier

# schema/data notes

## models

- model.reasoning_config CAN be empty for a reasoning model
- model.context_length is always included in endpoint.context_length[]

- [X] add 'audio' input modality

## endpoints

- pricing
  - reasoning_output (1): Perplexity | perplexity/sonar-deep-research
  - web_search (3): Perplexity | perplexity/sonar-deep-research; Perplexity | perplexity/sonar-pro; Perplexity | perplexity/sonar-reasoning-pro
  - per_request (4): OpenAI | openai/gpt-4o-mini-search-preview-2025-03-11; OpenAI | openai/gpt-4o-search-preview-2025-03-11; Perplexity | perplexity/sonar; Perplexity | perplexity/sonar-reasoning
  - discount (2): Crusoe | meta-llama/ll

- limits (excl. output_tokens):

```json
[
  {
    "limitType": "input_tokens",
    "count": 20,
    "endpoints": [
      ["OpenAI | openai/gpt-5-chat-2025-08-07", 272000],
      ["OpenAI | openai/gpt-5-2025-08-07", 272000],
      ["OpenAI | openai/gpt-5-mini-2025-08-07", 272000],
      ["OpenAI | openai/gpt-5-nano-2025-08-07", 272000],
      ["Alibaba | qwen/qwen3-30b-a3b-instruct-2507", 129024],
      ["Alibaba | qwen/qwen3-235b-a22b-thinking-2507", 129976],
      ["Z.AI | z-ai/glm-4-32b-0414", 4095],
      ["Alibaba | qwen/qwen3-coder-480b-a35b-07-25", 204800],
      ["Alibaba | qwen/qwen3-235b-a22b-07-25", 129024],
      ["Targon | deepseek/deepseek-chat-v3-0324:free", 163840],
      ["Targon | deepseek/deepseek-chat-v3-0324", 163840],
      ["Google AI Studio | google/gemini-2.0-flash-lite-001", 1048576],
      ["Alibaba | qwen/qwen-vl-plus", 6000],
      ["Alibaba | qwen/qwen-vl-max-2025-01-25", 6000],
      ["Alibaba | qwen/qwen2.5-vl-72b-instruct:free", 129024],
      ["Alibaba | qwen/qwen-plus-2025-01-25", 129024],
      ["Alibaba | qwen/qwen-max-2025-01-25", 30720],
      ["DeepInfra | microsoft/phi-4", 4096],
      ["Targon | deepseek/deepseek-chat-v3", 163840],
      ["Fireworks | meta-llama/llama-3.3-70b-instruct", 4096]
    ]
  },
  {
    "limitType": "images_per_prompt",
    "count": 10,
    "endpoints": [
      ["Chutes | moonshotai/kimi-vl-a3b-thinking:free", 8],
      ["Chutes | moonshotai/kimi-vl-a3b-thinking", 8],
      ["DeepInfra | meta-llama/llama-4-maverick-17b-128e-instruct", 1],
      ["Parasail | meta-llama/llama-4-maverick-17b-128e-instruct", 1],
      ["Novita | meta-llama/llama-4-maverick-17b-128e-instruct", 1],
      ["DeepInfra | meta-llama/llama-4-scout-17b-16e-instruct", 1],
      ["Parasail | meta-llama/llama-4-scout-17b-16e-instruct", 1],
      ["Novita | meta-llama/llama-4-scout-17b-16e-instruct", 1],
      ["OpenAI | openai/o1-pro", 1],
      ["DeepInfra | microsoft/phi-4-multimodal-instruct", 1]
    ]
  },
  {
    "limitType": "tokens_per_image",
    "count": 7,
    "endpoints": [
      ["DeepInfra | meta-llama/llama-4-maverick-17b-128e-instruct", 3342],
      ["Parasail | meta-llama/llama-4-maverick-17b-128e-instruct", 3342],
      ["Novita | meta-llama/llama-4-maverick-17b-128e-instruct", 3342],
      ["Together | meta-llama/llama-4-maverick-17b-128e-instruct", 3224],
      ["DeepInfra | meta-llama/llama-4-scout-17b-16e-instruct", 3342],
      ["Parasail | meta-llama/llama-4-scout-17b-16e-instruct", 3342],
      ["DeepInfra | microsoft/phi-4-multimodal-instruct", 3537]
    ]
  },
  {
    "limitType": "rpm",
    "count": 25,
    "endpoints": [
      ["Google | anthropic/claude-4.1-opus-20250805", 3],
      ["Google | anthropic/claude-4.1-opus-20250805", 3],
      ["Chutes | qwen/qwen3-235b-a22b-07-25", 5],
      ["Parasail | moonshotai/kimi-k2:free", 8],
      ["Targon | moonshotai/kimi-k2", 25],
      ["Moonshot AI | moonshotai/kimi-k2", 50],
      ["Parasail | moonshotai/kimi-k2", 10],
      ["Together | moonshotai/kimi-k2", 50],
      ["xAI | x-ai/grok-4-07-09", 1000],
      ["Google | google/gemini-2.5-pro", 300],
      ["Venice | qwen/qwen3-4b-04-28:free", 1],
      ["Venice | qwen/qwen3-235b-a22b-04-28:free", 1],
      ["Google | google/gemini-2.5-pro-exp-03-25", 1],
      ["Venice | mistralai/mistral-small-3.1-24b-instruct-2503:free", 1],
      ["Venice | qwen/qwq-32b:free", 1],
      ["Anthropic | anthropic/claude-3-7-sonnet-20250219", 80],
      ["Amazon Bedrock | anthropic/claude-3-7-sonnet-20250219", 500],
      ["Venice | qwen/qwen2.5-vl-72b-instruct:free", 2],
      ["Google AI Studio | google/gemini-2.0-flash-exp:free", 4],
      ["Venice | meta-llama/llama-3.3-70b-instruct:free", 1],
      ["Venice | qwen/qwen-2.5-coder-32b-instruct:free", 1],
      ["Google | anthropic/claude-3.5-sonnet", 200],
      ["Venice | meta-llama/llama-3.2-3b-instruct:free", 1],
      ["Venice | meta-llama/llama-3.1-405b-instruct:free", 1],
      ["Novita | moonshotai/kimi-k2", 50]
    ]
  },
  {
    "limitType": "rpd",
    "count": 3,
    "endpoints": [
      ["Google | google/gemini-2.5-pro-exp-03-25", 2000],
      ["Azure | deepseek/deepseek-r1", 200],
      ["Google AI Studio | google/gemini-2.0-flash-exp:free", 80]
    ]
  }
]
```
