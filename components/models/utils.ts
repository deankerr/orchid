import { type Doc } from '@/convex/_generated/dataModel'

// Define model types
export type ModelEndpoint = Doc<'modelEndpoints'>
export type Model = Doc<'models'>
export type ModelWithEndpoints = Model & { endpoints: ModelEndpoint[] }

/**
 * Format a timestamp to a human-readable date string
 */
export function formatTimestamp(timestamp: number): string {
  // Convert from seconds to milliseconds
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format a context length to a human-readable string
 */
export function formatContextLength(tokens: number | undefined): string {
  if (!tokens) return 'Unknown'
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M tokens`
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(0)}K tokens`
  }
  return `${tokens} tokens`
}

/**
 * Format a price to a human-readable string (per million tokens)
 */
export function formatPricePerM(price: number): string {
  // Convert from per-token to per-million tokens
  const pricePerMillion = price * 1000000

  if (pricePerMillion === 0) return '$0.00/M tokens'

  // Format based on price magnitude
  if (pricePerMillion < 0.01) {
    return `$${pricePerMillion.toFixed(4)}/M tokens`
  } else if (pricePerMillion < 1) {
    return `$${pricePerMillion.toFixed(3)}/M tokens`
  } else {
    return `$${pricePerMillion.toFixed(2)}/M tokens`
  }
}

/**
 * Format a price per thousand tokens
 */
export function formatPricePerK(price: number): string {
  // Convert from per-token to per-thousand tokens
  const pricePerK = price * 1000

  if (pricePerK === 0) return '$0.00/K tokens'

  // Format based on price magnitude
  if (pricePerK < 0.01) {
    return `$${pricePerK.toFixed(4)}/K tokens`
  } else if (pricePerK < 1) {
    return `$${pricePerK.toFixed(3)}/K tokens`
  } else {
    return `$${pricePerK.toFixed(2)}/K tokens`
  }
}

/**
 * Format a flat price (not per token)
 */
export function formatFlatPrice(price: number): string {
  if (price === 0) return '$0.00'

  if (price < 0.01) {
    return `$${price.toFixed(4)}`
  } else if (price < 1) {
    return `$${price.toFixed(3)}`
  } else {
    return `$${price.toFixed(2)}`
  }
}

/**
 * Get the best context length from a model's endpoints
 */
export function getBestContextLength(model: ModelWithEndpoints): number | undefined {
  // If there are no endpoints, return undefined
  if (!model.endpoints.length) return undefined

  // Sort by price (lowest prompt + completion price first) and return the context length
  const cheapestEndpoint = [...model.endpoints].sort(
    (a, b) => a.pricing.prompt + a.pricing.completion - (b.pricing.prompt + b.pricing.completion),
  )[0]

  return cheapestEndpoint.contextLength
}

/**
 * Get the price display for a model
 */
export function getModelPriceDisplay(model: ModelWithEndpoints): string {
  // If the model key ends with :free, it's a free model
  if (model.modelKey.endsWith(':free')) {
    return 'Free'
  }

  // If there are no endpoints, return unknown
  if (!model.endpoints.length) return 'Unknown'

  // Get the cheapest endpoint (lowest prompt + completion price)
  const cheapestEndpoint = [...model.endpoints].sort(
    (a, b) => a.pricing.prompt + a.pricing.completion - (b.pricing.prompt + b.pricing.completion),
  )[0]

  // Convert from per-token to per-million tokens
  const promptPricePerMillion = cheapestEndpoint.pricing.prompt * 1000000
  const completionPricePerMillion = cheapestEndpoint.pricing.completion * 1000000

  // Format the price display
  return `$${promptPricePerMillion.toFixed(2)}/$${completionPricePerMillion.toFixed(2)}`
}

/**
 * Get formatted pricing information for display
 */
export function getFormattedPricing(pricing: ModelEndpoint['pricing'], isFreeModel: boolean) {
  if (isFreeModel) {
    return [{ name: 'Pricing', value: 'Free' }]
  }

  // Always include prompt and completion
  const result = [
    { name: 'Prompt Price', value: formatPricePerM(pricing.prompt) },
    { name: 'Completion Price', value: formatPricePerM(pricing.completion) },
  ]

  // Add other non-zero pricing fields with appropriate formatting

  // Image and request prices are per K tokens
  if (pricing.image && pricing.image > 0) {
    result.push({ name: 'Image Price', value: formatPricePerK(pricing.image) })
  }
  if (pricing.request && pricing.request > 0) {
    result.push({ name: 'Request Price', value: formatPricePerK(pricing.request) })
  }

  // Web search is a flat price
  if (pricing.webSearch && pricing.webSearch > 0) {
    result.push({ name: 'Web Search Price', value: formatFlatPrice(pricing.webSearch) })
  }

  // Regular per million token pricing
  if (pricing.internalReasoning && pricing.internalReasoning > 0) {
    result.push({
      name: 'Internal Reasoning Price',
      value: formatPricePerM(pricing.internalReasoning),
    })
  }

  // Discount might be a percentage, display as is
  if (pricing.discount && pricing.discount > 0) {
    result.push({
      name: 'Discount',
      value: `${pricing.discount}`,
    })
  }

  return result
}

/**
 * Truncate text to a maximum length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
