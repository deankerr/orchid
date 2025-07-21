import * as R from 'remeda'

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
  hasFreeVariant: boolean
  hasPromptCaching: boolean
}

export interface FilterResult {
  modelId: string // model._id
  endpointIds: string[] // endpoint._id for each variant to display
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
  hasPromptCaching: boolean
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
    hasFreeVariant: endpoints.some((endpoint) => endpoint.model_variant === 'free'),
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
  free: boolean
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
    hasFreeVariant: urlState.free,
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
    filters.hasFreeVariant ||
    filters.hasPromptCaching
  )
}

// Fuzzy search helper
function fuzzyMatch(query: string, text: string): boolean {
  const normalizedQuery = query.toLowerCase()
  const normalizedText = text.toLowerCase()

  // Simple contains match for now - could be enhanced with more sophisticated matching
  return normalizedText.includes(normalizedQuery)
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
      return endpoints.sort(
        (a, b) =>
          (a.pricing.input ?? Number.POSITIVE_INFINITY) -
          (b.pricing.input ?? Number.POSITIVE_INFINITY),
      )[0]

    case 'output_price':
      return endpoints.sort(
        (a, b) =>
          (a.pricing.output ?? Number.POSITIVE_INFINITY) -
          (b.pricing.output ?? Number.POSITIVE_INFINITY),
      )[0]

    case 'context':
      return endpoints.sort((a, b) => b.context_length - a.context_length)[0]

    case 'throughput':
      return endpoints.sort(
        (a, b) => (b.stats?.p50_throughput ?? 0) - (a.stats?.p50_throughput ?? 0),
      )[0]

    case 'latency':
      return endpoints.sort(
        (a, b) =>
          (a.stats?.p50_latency ?? Number.POSITIVE_INFINITY) -
          (b.stats?.p50_latency ?? Number.POSITIVE_INFINITY),
      )[0]

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
  // Group endpoints by model slug
  const endpointsByModel = R.groupBy(endpoints, (endpoint) => endpoint.model_slug)

  // Filter models based on criteria
  const filteredModels = models.filter((model) => {
    // Text search (fuzzy match on name)
    if (filters.search && !fuzzyMatch(filters.search, model.name)) {
      return false
    }

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
    if (filters.hasFreeVariant && !capabilities.hasFreeVariant) return false
    if (filters.hasPromptCaching && !capabilities.hasPromptCaching) return false

    // Must have at least one valid endpoint after individual endpoint filtering
    const validEndpoints = modelEndpoints.filter((endpoint) => {
      if (filters.hasTools && !endpoint.capabilities.tools) return false
      if (filters.hasJsonResponse && !endpoint.supported_parameters.includes('response_format'))
        return false
      if (filters.hasFreeVariant && endpoint.model_variant !== 'free') return false
      if (
        filters.hasPromptCaching &&
        (!endpoint.pricing.cache_read || !endpoint.pricing.cache_write)
      )
        return false
      return true
    })

    return validEndpoints.length > 0
  })

  // Create result with selected endpoints per variant
  const results: FilterResult[] = filteredModels
    .map((model) => {
      const modelEndpoints = endpointsByModel[model.slug] || []

      // Apply endpoint filters
      const validEndpoints = modelEndpoints.filter((endpoint) => {
        if (filters.hasTools && !endpoint.capabilities.tools) return false
        if (filters.hasJsonResponse && !endpoint.supported_parameters.includes('response_format'))
          return false
        if (filters.hasFreeVariant && endpoint.model_variant !== 'free') return false
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
      }
    })
    .filter((result) => result.endpointIds.length > 0) // Only include models with valid endpoints

  // Sort results based on sort criteria and direction
  const sortedResults = results.sort((a, b) => {
    const modelA = models.find((m) => m._id === a.modelId)!
    const modelB = models.find((m) => m._id === b.modelId)!
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
        const priceA = endpointA?.pricing.input ?? Number.POSITIVE_INFINITY
        const priceB = endpointB?.pricing.input ?? Number.POSITIVE_INFINITY
        comparison = priceA - priceB
        break
      }

      case 'output_price': {
        const endpointA = endpoints.find((e) => e._id === a.endpointIds[0])
        const endpointB = endpoints.find((e) => e._id === b.endpointIds[0])
        const priceA = endpointA?.pricing.output ?? Number.POSITIVE_INFINITY
        const priceB = endpointB?.pricing.output ?? Number.POSITIVE_INFINITY
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
        const throughputA = endpointA?.stats?.p50_throughput ?? 0
        const throughputB = endpointB?.stats?.p50_throughput ?? 0
        comparison = throughputB - throughputA
        break
      }

      case 'latency': {
        const endpointA = endpoints.find((e) => e._id === a.endpointIds[0])
        const endpointB = endpoints.find((e) => e._id === b.endpointIds[0])
        const latencyA = endpointA?.stats?.p50_latency ?? Number.POSITIVE_INFINITY
        const latencyB = endpointB?.stats?.p50_latency ?? Number.POSITIVE_INFINITY
        comparison = latencyA - latencyB
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
