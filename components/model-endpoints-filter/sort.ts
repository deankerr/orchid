export type SortDirection = 'asc' | 'desc'

// Single consolidated sort record
export const SORT_CONFIG = {
  created: { label: 'Recently Added' },
  tokens_7d: { label: 'Tokens (7D)' },
  alphabetical: { label: 'Alphabetical' },
  input_price: { label: 'Input Price' },
  output_price: { label: 'Output Price' },
  context: { label: 'Context Length' },
  throughput: { label: 'Throughput' },
  latency: { label: 'Latency' },
} as const

// Derived type
export type SortOption = keyof typeof SORT_CONFIG

export const SORT_OPTIONS = Object.entries(SORT_CONFIG).map(([value, config]) => ({
  value: value as SortOption,
  label: config.label,
}))
