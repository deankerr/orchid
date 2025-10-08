type PricingFormat = {
  transform: (value: number) => number
  unit: string
}

// Pricing format configurations using our schema keys
export const pricingFormats: Record<string, PricingFormat> = {
  // Per-token pricing (display per million tokens)
  text_input: { transform: (v) => v * 1_000_000, unit: '/MTOK' },
  text_output: { transform: (v) => v * 1_000_000, unit: '/MTOK' },
  internal_reasoning: { transform: (v) => v * 1_000_000, unit: '/MTOK' },
  cache_read: { transform: (v) => v * 1_000_000, unit: '/MTOK' },
  cache_write: { transform: (v) => v * 1_000_000, unit: '/MTOK' },
  audio_input: { transform: (v) => v * 1_000_000, unit: '/MTOK' },
  audio_cache_input: { transform: (v) => v * 1_000_000, unit: '/MTOK' },

  // Per-unit pricing (display per thousand units)
  image_input: { transform: (v) => v * 1_000, unit: '/1000 IMAGES' },
  image_output: { transform: (v) => v * 1_000, unit: '/1000 IMAGES' },

  // Per-request pricing
  request: { transform: (v) => v, unit: '' },
  web_search: { transform: (v) => v, unit: '' },

  // Percentage (discount)
  discount: { transform: (v) => v * 100, unit: '%' },
}

// Key mappings from raw API keys to our schema keys
const rawKeyMappings: Record<string, string> = {
  // Raw API keys -> our schema keys
  prompt: 'text_input',
  completion: 'text_output',
  image: 'image_input',
  internal_reasoning: 'internal_reasoning',
  request: 'request',
  cache_read: 'cache_read',
  cache_write: 'cache_write',
  web_search: 'web_search',
  discount: 'discount',
  audio: 'audio_input',
  input_audio_cache: 'audio_cache_input',
  input_cache_read: 'cache_read',
  input_cache_write: 'cache_write',
  image_output: 'image_output',
}

export function formatPrice({
  priceKey,
  priceValue,
  unitPrefix = true,
  unitSuffix = true,
}: {
  priceKey: string
  priceValue: number
  unitPrefix?: boolean
  unitSuffix?: boolean
}): string {
  // Map from raw API keys to our schema keys if needed
  const schemaKey = rawKeyMappings[priceKey] || priceKey

  // Get the format configuration
  const format = pricingFormats[schemaKey]

  if (!format) {
    return String(priceValue)
  }

  const transformedValue = format.transform(priceValue)

  // Special handling for discount (percentage formatting)
  if (schemaKey === 'discount') {
    const formattedValue = transformedValue.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    const suffix = unitSuffix ? format.unit : ''
    return `${formattedValue}${suffix}`
  }

  const formattedValue = transformedValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  })

  const prefix = unitPrefix ? '$' : ''
  const suffix = unitSuffix ? format.unit : ''
  return `${prefix}${formattedValue}${suffix}`
}

/**
 * Format a timestamp as relative time (e.g., "2 days ago", "3 hours ago")
 * Returns appropriate unit based on time difference
 */

export function formatRelativeTime(
  timestamp: number,
  options?: { format?: 'short' | 'long' },
): string {
  const format = options?.format ?? 'short'
  const now = Date.now()
  const diffMs = now - timestamp
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffMinutes < 1) {
    return 'Just now'
  } else if (diffMinutes < 60) {
    if (format === 'long') {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
    }
    return `${diffMinutes}m ago`
  } else if (diffHours < 24) {
    if (format === 'long') {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    }
    return `${diffHours}h ago`
  } else if (diffDays < 7) {
    if (format === 'long') {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
    }
    return `${diffDays}d ago`
  } else if (diffWeeks < 4) {
    if (format === 'long') {
      return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`
    }
    return `${diffWeeks}w ago`
  } else if (diffMonths < 12) {
    if (format === 'long') {
      return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`
    }
    return `${diffMonths}mo ago`
  } else {
    if (format === 'long') {
      return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`
    }
    return `${diffYears}y ago`
  }
}

/**
 * Format a timestamp as a readable date-time string for display
 * Uses ISO format with space separator for readability
 */

export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date
    .toLocaleString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    .replace(',', '')
}

/**
 * Format a timestamp as a readable date-time string for display in UTC
 * Uses ISO format with space separator for readability
 */

export function formatDateTimeUTC(timestamp: number): string {
  const date = new Date(timestamp)
  return date
    .toLocaleString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    })
    .replace(',', '')
}
