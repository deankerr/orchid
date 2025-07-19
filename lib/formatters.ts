/**
 * Common number transformations used throughout the app
 */
export const transforms = {
  toMillion: (v: number) => v * 1_000_000,
  toThousand: (v: number) => v * 1_000,
  toPercent: (v: number) => v * 100,
  identity: (v: number) => v,
} as const

/**
 * Pricing field configurations with units and transformations
 */
export const pricingFormats = {
  input: { unit: '/MTOK', transform: transforms.toMillion, digits: 2 },
  output: { unit: '/MTOK', transform: transforms.toMillion, digits: 2 },
  reasoning_output: { unit: '/MTOK', transform: transforms.toMillion, digits: 2 },
  cache_read: { unit: '/MTOK', transform: transforms.toMillion, digits: 2 },
  cache_write: { unit: '/MTOK', transform: transforms.toMillion, digits: 2 },
  image_input: { unit: '/KTOK', transform: transforms.toThousand, digits: 2 },
  web_search: { unit: '', transform: transforms.identity, digits: 2 },
  per_request: { unit: '', transform: transforms.identity, digits: 2 },
  discount: { unit: '%', transform: transforms.toPercent, digits: 0 },
} as const

/**
 * Common metric formats used in the app
 */
export const metricFormats = {
  tokens: { unit: 'TOK', digits: 0 },
  tokensPerSecond: { unit: 'TOK/S', digits: 0 },
  milliseconds: { unit: 'MS', digits: 0 },
  percentage: { unit: '%', digits: 0, transform: transforms.toPercent },
  count: { unit: '', digits: 0 },
} as const
