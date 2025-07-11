import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatIsoDate(date: number) {
  return new Date(date).toISOString().split('T')[0]
}

export function formatSnapshotAtTime(timestamp: number | string) {
  return new Date(timestamp).toISOString().slice(2, 13).replace('T', ' ')
}

export function formatTokenPriceToM(value?: number) {
  if (value === undefined) return ' - '
  return `${(value * 1_000_000).toFixed(2)}`
}

export function formatTokenPriceToK(value = 0) {
  return `$${(value * 1_000).toFixed(2)} / KTok`
}

export function formatTimestampToYMDHM(timestamp: number) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hour}:${minute}`
}

export function formatTokenCount(count: number): string {
  if (count >= 1_000_000_000) {
    return `${(count / 1_000_000_000).toFixed(1)}B`
  }
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`
  }
  return count.toString()
}

/**
 * Build a URL for a Convex HTTP endpoint
 * Converts .convex.cloud to .convex.site and adds the path
 */
export function getConvexHttpUrl(path: string): string {
  // Access environment variable using globalThis to avoid TypeScript issues
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

  if (!convexUrl) {
    throw new Error('NEXT_PUBLIC_CONVEX_URL environment variable is not set')
  }

  // Replace .convex.cloud with .convex.site
  const httpUrl = convexUrl.replace('.convex.cloud', '.convex.site')

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${httpUrl}${normalizedPath}`
}

// Endpoint data formatting utilities
export function formatNumber(value?: number | null, decimals = 0): string {
  if (value === null || value === undefined) return '—'
  return value.toLocaleString('en-US', { maximumFractionDigits: decimals })
}

export function formatTokenPrice(value?: number | null): string {
  if (value === null || value === undefined) return '—'
  const pricePerMillion = value * 1_000_000
  if (pricePerMillion < 0.01) return '<0.01'
  if (pricePerMillion < 1) return pricePerMillion.toFixed(2)
  if (pricePerMillion < 10) return pricePerMillion.toFixed(1)
  return pricePerMillion.toFixed(0)
}

export function formatThroughput(value?: number | null): string {
  if (value === null || value === undefined) return '—'
  if (value < 10) return value.toFixed(1)
  return Math.round(value).toLocaleString()
}

export function formatLatency(value?: number | null): string {
  if (value === null || value === undefined) return '—'
  if (value < 100) return `${value.toFixed(0)}ms`
  if (value < 1000) return `${Math.round(value)}ms`
  return `${(value / 1000).toFixed(1)}s`
}

export function formatPercentage(value?: number | null, decimals = 1): string {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(decimals)}%`
}

export function formatTokenLimit(value?: number | null): string {
  if (value === null || value === undefined) return '—'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toLocaleString()
}

export function formatRateLimit(value?: number | null): string {
  if (value === null || value === undefined) return '—'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`
  return value.toLocaleString()
}
