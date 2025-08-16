import * as R from 'remeda'

import fuzzysort from 'fuzzysort'

import type { Endpoint, Model } from '@/hooks/api'

import { type SortDirection, type SortOption } from './sort'

export type FilterState = {
  // Text search
  search: string

  // Model capabilities (from model.input_modalities)
  hasImageInput: boolean
  hasFileInput: boolean
  hasReasoning: boolean

  // Endpoint features
  hasTools: boolean
  hasJsonResponse: boolean
  pricingFilter: 'all' | 'free' | 'paid'
  hasPromptCaching: boolean
}

export interface FilterResult {
  modelId: string // model._id
  endpointIds: string[] // endpoint._id for each variant to display
  score?: number // fuzzy search score (higher is better)
}

// Type for model capabilities
export type ModelCapabilities = {
  // Model-level capabilities
  hasImageInput: boolean
  hasFileInput: boolean
  hasReasoning: boolean

  // Endpoint-level capabilities (aggregated)
  hasTools: boolean
  hasJsonResponse: boolean
  hasFreeVariant: boolean
  hasPaidVariant: boolean
  hasPromptCaching: boolean
  hasStructuredOutputs: boolean
}

/**
 * Get all capabilities for a model based on its properties and available endpoints.
 *
 * Model-level capabilities are derived directly from the model properties.
 * Endpoint-level capabilities are aggregated - returns true if ANY endpoint has the capability.
 *
 * This is the single source of truth for capability checking across the application.
 */
export function getModelCapabilities(model: Model, endpoints: Endpoint[]): ModelCapabilities {
  return {
    // Model-level capabilities
    hasImageInput: model.input_modalities.includes('image'),
    hasFileInput: model.input_modalities.includes('file'),
    hasReasoning: endpoints.some((endpoint) => endpoint.capabilities.reasoning), // is technically model level

    // Endpoint-level capabilities (true if ANY endpoint has the capability)
    hasTools: endpoints.some((endpoint) => endpoint.capabilities.tools),
    hasJsonResponse: endpoints.some((endpoint) =>
      endpoint.supported_parameters.includes('response_format'),
    ),
    hasStructuredOutputs: endpoints.some((endpoint) =>
      endpoint.supported_parameters.includes('structured_outputs'),
    ),
    hasFreeVariant: endpoints.some((endpoint) => endpoint.model_variant === 'free'),
    hasPaidVariant: endpoints.some((endpoint) => endpoint.model_variant !== 'free'),
    hasPromptCaching: endpoints.some(
      (endpoint) => !!endpoint.pricing.cache_read && !!endpoint.pricing.cache_write,
    ),
  }
}

// Convert URL state to FilterState format
export function urlStateToFilterState(urlState: {
  q: string
  img: boolean
  file: boolean
  reason: boolean
  tools: boolean
  json: boolean
  pricing: 'all' | 'free' | 'paid'
  cache: boolean
  sort: SortOption
  dir: SortDirection
}): FilterState & { sort: SortOption; direction: SortDirection } {
  return {
    search: urlState.q,
    hasImageInput: urlState.img,
    hasFileInput: urlState.file,
    hasReasoning: urlState.reason,
    hasTools: urlState.tools,
    hasJsonResponse: urlState.json,
    pricingFilter: urlState.pricing,
    hasPromptCaching: urlState.cache,
    sort: urlState.sort,
    direction: urlState.dir,
  }
}

// Helper to check if filter state has any active filters
export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.search !== '' ||
    filters.hasImageInput ||
    filters.hasFileInput ||
    filters.hasReasoning ||
    filters.hasTools ||
    filters.hasJsonResponse ||
    filters.pricingFilter !== 'all' ||
    filters.hasPromptCaching
  )
}

// Select best endpoint based on sort criteria
function selectBestEndpoint(endpoints: Endpoint[], sortBy: SortOption): Endpoint | null {
  if (endpoints.length === 0) return null

  switch (sortBy) {
    case 'created':
    case 'tokens_7d':
    case 'alphabetical':
      // Model-level sorts use traffic_share for endpoint selection
      return endpoints.sort((a, b) => (b.traffic_share ?? 0) - (a.traffic_share ?? 0))[0]

    case 'input_price':
      return endpoints.sort((a, b) => (a.pricing.input ?? 0) - (b.pricing.input ?? 0))[0]

    case 'output_price':
      return endpoints.sort((a, b) => (a.pricing.output ?? 0) - (b.pricing.output ?? 0))[0]

    case 'context':
      return endpoints.sort((a, b) => b.context_length - a.context_length)[0]

    case 'throughput': {
      const validEndpoints = endpoints.filter((e) => e.stats?.p50_throughput != null)
      if (validEndpoints.length === 0) return null
      return validEndpoints.sort((a, b) => b.stats!.p50_throughput - a.stats!.p50_throughput)[0]
    }

    case 'latency': {
      const validEndpoints = endpoints.filter((e) => e.stats?.p50_latency != null)
      if (validEndpoints.length === 0) return null
      return validEndpoints.sort((a, b) => a.stats!.p50_latency - b.stats!.p50_latency)[0]
    }

    default:
      const _exhaustive: never = sortBy
      throw new Error(`Unhandled sort option: ${_exhaustive}`)
  }
}

// Main filter function
export function filterModels(
  models: Model[],
  endpoints: Endpoint[],
  filters: FilterState,
  sortBy: SortOption,
  direction: SortDirection = 'desc',
): FilterResult[] {
  // Trim search string once at the top
  const searchQuery = filters.search.trim()

  // Group endpoints by model slug
  const endpointsByModel = R.groupBy(endpoints, (endpoint) => endpoint.model_slug)

  // Apply capability filters first (non-search filters)
  const capabilityFilteredModels = models.filter((model) => {
    // Get all model endpoints
    const modelEndpoints = endpointsByModel[model.slug] || []

    // Check capabilities using centralized function
    const capabilities = getModelCapabilities(model, modelEndpoints)

    // Apply capability filters
    if (filters.hasImageInput && !capabilities.hasImageInput) return false
    if (filters.hasFileInput && !capabilities.hasFileInput) return false
    if (filters.hasReasoning && !capabilities.hasReasoning) return false
    if (filters.hasTools && !capabilities.hasTools) return false
    if (filters.hasJsonResponse && !capabilities.hasJsonResponse) return false
    if (filters.pricingFilter === 'free' && !capabilities.hasFreeVariant) return false
    if (filters.pricingFilter === 'paid' && !capabilities.hasPaidVariant) return false
    if (filters.hasPromptCaching && !capabilities.hasPromptCaching) return false

    // Must have at least one valid endpoint after individual endpoint filtering
    const validEndpoints = modelEndpoints.filter((endpoint) => {
      if (filters.hasTools && !endpoint.capabilities.tools) return false
      if (filters.hasJsonResponse && !endpoint.supported_parameters.includes('response_format'))
        return false
      if (filters.pricingFilter === 'free' && endpoint.model_variant !== 'free') return false
      if (filters.pricingFilter === 'paid' && endpoint.model_variant === 'free') return false
      if (
        filters.hasPromptCaching &&
        (!endpoint.pricing.cache_read || !endpoint.pricing.cache_write)
      )
        return false
      return true
    })

    return validEndpoints.length > 0
  })

  // Apply fuzzy search if there's a search query
  const filteredModels = searchQuery
    ? fuzzysort
        .go(searchQuery, capabilityFilteredModels, { key: 'name', all: true })
        .map((result) => ({ model: result.obj, score: Math.round(result.score * 10) / 10 }))
    : capabilityFilteredModels.map((model) => ({ model, score: 0 }))

  // Create result with selected endpoints per variant
  const results: FilterResult[] = filteredModels
    .map(({ model, score }) => {
      const modelEndpoints = endpointsByModel[model.slug] || []

      // Apply endpoint filters
      const validEndpoints = modelEndpoints.filter((endpoint) => {
        if (filters.hasTools && !endpoint.capabilities.tools) return false
        if (filters.hasJsonResponse && !endpoint.supported_parameters.includes('response_format'))
          return false
        if (filters.pricingFilter === 'free' && endpoint.model_variant !== 'free') return false
        if (filters.pricingFilter === 'paid' && endpoint.model_variant === 'free') return false
        if (
          filters.hasPromptCaching &&
          (!endpoint.pricing.cache_read || !endpoint.pricing.cache_write)
        )
          return false
        return true
      })

      // Group by variant and select best endpoint per variant
      const variantGroups = R.groupBy(validEndpoints, (endpoint) => endpoint.model_variant)

      const selectedEndpoints = Object.entries(variantGroups)
        .map(([_variant, endpoints]) => selectBestEndpoint(endpoints, sortBy))
        .filter(R.isNonNullish)

      return {
        modelId: model._id,
        endpointIds: selectedEndpoints.map((endpoint) => endpoint._id),
        score, // Include fuzzy search score for sorting
      }
    })
    .filter((result) => result.endpointIds.length > 0) // Only include models with valid endpoints

  // Sort results based on sort criteria and direction
  const sortedResults = results.sort((a, b) => {
    const modelA = models.find((m) => m._id === a.modelId)!
    const modelB = models.find((m) => m._id === b.modelId)!

    // If there's a search query, prioritize fuzzy search score bands first
    if (searchQuery && a.score !== undefined && b.score !== undefined) {
      const aTruncatedScore = Math.floor(a.score * 10) / 10
      const bTruncatedScore = Math.floor(b.score * 10) / 10

      // Sort by truncated fuzzysort score in descending order (higher score is better)
      if (aTruncatedScore !== bTruncatedScore) {
        return bTruncatedScore - aTruncatedScore
      }
    }

    let comparison = 0

    switch (sortBy) {
      case 'created':
        comparison = modelB.or_created_at - modelA.or_created_at
        break

      case 'tokens_7d': {
        const tokensA = Object.values(modelA.stats || {}).reduce(
          (sum: number, variant: any) => sum + (variant.tokens_7d || 0),
          0,
        )
        const tokensB = Object.values(modelB.stats || {}).reduce(
          (sum: number, variant: any) => sum + (variant.tokens_7d || 0),
          0,
        )
        comparison = tokensB - tokensA
        break
      }

      case 'alphabetical':
        comparison = modelA.name.localeCompare(modelB.name)
        break

      case 'input_price': {
        const endpointA = endpoints.find((e) => e._id === a.endpointIds[0])
        const endpointB = endpoints.find((e) => e._id === b.endpointIds[0])
        const priceA = endpointA?.pricing.input ?? 0
        const priceB = endpointB?.pricing.input ?? 0
        comparison = priceA - priceB
        break
      }

      case 'output_price': {
        const endpointA = endpoints.find((e) => e._id === a.endpointIds[0])
        const endpointB = endpoints.find((e) => e._id === b.endpointIds[0])
        const priceA = endpointA?.pricing.output ?? 0
        const priceB = endpointB?.pricing.output ?? 0
        comparison = priceA - priceB
        break
      }

      case 'context': {
        const endpointA = endpoints.find((e) => e._id === a.endpointIds[0])
        const endpointB = endpoints.find((e) => e._id === b.endpointIds[0])
        comparison = (endpointB?.context_length ?? 0) - (endpointA?.context_length ?? 0)
        break
      }

      case 'throughput': {
        const endpointA = endpoints.find((e) => e._id === a.endpointIds[0])
        const endpointB = endpoints.find((e) => e._id === b.endpointIds[0])
        const hasStatsA = endpointA?.stats?.p50_throughput != null
        const hasStatsB = endpointB?.stats?.p50_throughput != null

        // If only one has stats, prioritize the one with stats
        if (hasStatsA && !hasStatsB) return -1
        if (!hasStatsA && hasStatsB) return 1

        // If both have stats, compare them
        if (hasStatsA && hasStatsB) {
          comparison = endpointB!.stats!.p50_throughput - endpointA!.stats!.p50_throughput
        } else {
          // Both lack stats, maintain original order
          comparison = 0
        }
        break
      }

      case 'latency': {
        const endpointA = endpoints.find((e) => e._id === a.endpointIds[0])
        const endpointB = endpoints.find((e) => e._id === b.endpointIds[0])
        const hasStatsA = endpointA?.stats?.p50_latency != null
        const hasStatsB = endpointB?.stats?.p50_latency != null

        // If only one has stats, prioritize the one with stats
        if (hasStatsA && !hasStatsB) return -1
        if (!hasStatsA && hasStatsB) return 1

        // If both have stats, compare them
        if (hasStatsA && hasStatsB) {
          comparison = endpointA!.stats!.p50_latency - endpointB!.stats!.p50_latency
        } else {
          // Both lack stats, maintain original order
          comparison = 0
        }
        break
      }

      default:
        comparison = 0
    }

    // Apply direction (flip comparison for ascending)
    return direction === 'asc' ? -comparison : comparison
  })

  return sortedResults
}
