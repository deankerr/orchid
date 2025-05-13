# ORCHID: OpenRouter Capability & Health Intelligence Dashboard

## Overview

The OpenRouter Capability & Health Intelligence Dashboard (ORCHID) aims to create a comprehensive data aggregation, analysis, and visualization platform for models and providers available through the OpenRouter API. We'll maintain a local database of model and provider information that updates regularly, allowing us to query, compare, and track changes over time.

This system will collect and surface key model properties including modalities, tool support, and capabilities, while providing flexible search and filtering options. By maintaining our own data repository, we can develop custom workflows for presenting and enriching this information to better suit our specific needs.

## Features

### Model and Provider Data Management

- **Data Collection**: Regular fetching and storage of model/provider data from OpenRouter API
- **Change Tracking**: Historical views of how model availability and capabilities evolve
- **Custom Enrichment**: Ability to add our own metadata and categorizations

### Model Performance Monitoring

- **Reliability Metrics**: Track success rates and response times across providers
- **Feature Verification**: Test advertised capabilities like tool support to confirm functionality
- **Response Quality Assessment**: Compare output quality across providers with identical prompts
- **Edge Case Detection**: Identify specific patterns that may cause issues (e.g., consecutive message roles)

### Search and Discovery

- **Tabular Browsing**: Structured view of all available models with sortable properties
- **Fuzzy Search**: Natural language querying to find models based on capabilities
- **Filtering System**: Narrow results by modality, provider, capabilities, or performance metrics

### Model Database Enrichment

- **Categorization**: Custom tags and classifications for use cases and strengths
- **Benchmark Integration**: Import and display performance benchmarks from various sources
- **Automated Enrichment**: Use LLMs and web search to gather additional model information

## Proposed Entities

- **Model**: Core entity representing an AI model with its capabilities, parameters, and history
- **Provider**: Entity representing services hosting models, with reliability metrics
- **Test**: Structured evaluation scenarios to verify model/provider performance
- **TestResult**: Historical test outcomes linked to models/providers
- **ModelMetadata**: Custom enrichment data we add to models
- **ChangeRecord**: Tracking of changes to model/provider availability and capabilities

## Workflows

- **Data Synchronization**: Daily job to fetch latest OpenRouter model/provider data
- **Performance Testing**: Scheduled test suite running at configurable intervals
- **Change Detection**: Automated comparison of current and previous data snapshots
- **Enrichment Process**: Semi-automated workflow to gather and add custom metadata
- **Search and Filter**: User-facing interface for model discovery and comparison

## Technologies

- Next.js, shadcn/ui
- Convex (backend/database)
