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

// Single consolidated sort record
export const SORT_CONFIG = {
  created: { label: 'Recently Added', naturalDirection: 'desc' },
  tokens_7d: { label: 'Tokens (7d)', naturalDirection: 'desc' },
  tokens_30d: { label: 'Tokens (30d)', naturalDirection: 'desc' },
  alphabetical: { label: 'Alphabetical', naturalDirection: 'asc' },
  input_price: { label: 'Input Price', naturalDirection: 'asc' },
  output_price: { label: 'Output Price', naturalDirection: 'asc' },
  context: { label: 'Context Length', naturalDirection: 'desc' },
  throughput: { label: 'Throughput', naturalDirection: 'desc' },
  latency: { label: 'Latency', naturalDirection: 'asc' },
} as const

// Derived type
export type SortOption = keyof typeof SORT_CONFIG

export const SORT_OPTIONS = Object.entries(SORT_CONFIG).map(([value, config]) => ({
  value: value as SortOption,
  label: config.label,
}))

export interface FilterResult {
  modelId: string // model._id
  endpointIds: string[] // endpoint._id for each variant to display
}
