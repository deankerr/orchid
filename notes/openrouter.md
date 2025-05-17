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
