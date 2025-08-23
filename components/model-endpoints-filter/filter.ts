import * as R from 'remeda'

import fuzzysort from 'fuzzysort'

import type { Endpoint, Model } from '@/hooks/api'

import { getModelCapabilityAttributes } from '../attributes'
import type { useModelFilterSearchParams } from './search-params'
import { type SortOption } from './sort'

export interface FilterResult {
  modelId: string // model._id
  endpointIds: string[] // endpoint._id for each variant to display
  score?: number // fuzzy search score (higher is better)
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
  filters: ReturnType<typeof useModelFilterSearchParams>[0],
): FilterResult[] {
  const searchQuery = filters.q.trim()
  const sortBy = filters.sort
  const direction = filters.dir

  // Group endpoints by model slug
  const endpointsByModel = R.groupBy(endpoints, (endpoint) => endpoint.model_slug)

  // Apply attribute filters first (non-search filters)
  const attributeFilteredModels = models.filter((model) => {
    // Get all model endpoints
    const endpoints = endpointsByModel[model.slug] || []

    // Check attributes using centralized function
    const attributes = R.fromEntries(getModelCapabilityAttributes({ model, endpoints }))

    // Apply attribute filters
    if (filters.image && !attributes.image) return false
    if (filters.pdf && !attributes.pdf) return false
    if (filters.audio && !attributes.audio) return false
    if (filters.reason && !attributes.reason) return false
    if (filters.tools && !attributes.tools) return false
    if (filters.json && !attributes.json) return false
    if (filters.struct && !attributes.struct) return false
    if (filters.pricing === 'free' && endpoints.every((e) => e.model_variant !== 'free'))
      return false
    if (filters.pricing === 'paid' && endpoints.every((e) => e.model_variant === 'free'))
      return false
    if (filters.cache && !attributes.cache) return false

    // Must have at least one valid endpoint after individual endpoint filtering
    const validEndpoints = endpoints.filter((endpoint) => {
      if (filters.tools && !endpoint.capabilities.tools) return false
      if (filters.json && !endpoint.supported_parameters.includes('response_format')) return false
      if (filters.struct && !endpoint.supported_parameters.includes('structured_outputs'))
        return false
      if (filters.pricing === 'free' && endpoint.model_variant !== 'free') return false
      if (filters.pricing === 'paid' && endpoint.model_variant === 'free') return false
      if (filters.cache && (!endpoint.pricing.cache_read || !endpoint.pricing.cache_write))
        return false
      return true
    })

    return validEndpoints.length > 0
  })

  // Apply fuzzy search if there's a search query
  const filteredModels = searchQuery
    ? fuzzysort
        .go(searchQuery, attributeFilteredModels, { keys: ['name', 'slug'], all: true })
        .map((result) => ({ model: result.obj, score: Math.round(result.score * 10) / 10 }))
    : attributeFilteredModels.map((model) => ({ model, score: 0 }))

  // Create result with selected endpoints per variant
  const results: FilterResult[] = filteredModels
    .map(({ model, score }) => {
      const modelEndpoints = endpointsByModel[model.slug] || []

      // Apply endpoint filters
      const validEndpoints = modelEndpoints.filter((endpoint) => {
        if (filters.tools && !endpoint.capabilities.tools) return false
        if (filters.json && !endpoint.supported_parameters.includes('response_format')) return false
        if (filters.struct && !endpoint.supported_parameters.includes('structured_outputs'))
          return false
        if (filters.pricing === 'free' && endpoint.model_variant !== 'free') return false
        if (filters.pricing === 'paid' && endpoint.model_variant === 'free') return false
        if (filters.cache && (!endpoint.pricing.cache_read || !endpoint.pricing.cache_write))
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
