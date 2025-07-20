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

export type SortDirection = 'asc' | 'desc'

export type SortOption =
  | 'created' // model.or_created_at
  | 'tokens_7d' // sum of all variant tokens
  | 'tokens_30d' // sum of all variant tokens
  | 'alphabetical' // model.name
  | 'input_price' // endpoint.pricing.input
  | 'output_price' // endpoint.pricing.output
  | 'context' // endpoint.context_length
  | 'throughput' // endpoint.stats.p50_throughput
  | 'latency' // endpoint.stats.p50_latency

export interface FilterResult {
  modelId: string // model._id
  endpointIds: string[] // endpoint._id for each variant to display
}

// Natural sort directions for each option
export const NATURAL_SORT_DIRECTIONS: Record<SortOption, SortDirection> = {
  created: 'desc', // newest first
  tokens_7d: 'desc', // highest usage first
  tokens_30d: 'desc', // highest usage first
  alphabetical: 'asc', // A-Z
  input_price: 'asc', // cheapest first
  output_price: 'asc', // cheapest first
  context: 'desc', // highest context first
  throughput: 'desc', // fastest first
  latency: 'asc', // lowest latency first
}
