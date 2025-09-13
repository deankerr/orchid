import * as R from 'remeda'

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate percentage change between two numeric values
 * Returns null if either value is not a number or if old value is 0
 * Handles both numbers and strings by parsing strings first
 */
export function calculatePercentageChange(from: unknown, to: unknown): number | null {
  if (R.isBoolean(from) || R.isBoolean(to)) return null

  const fromValue = Number(from)
  const toValue = Number(to)

  // Check if both values are valid numbers
  if (isNaN(fromValue) || isNaN(toValue)) {
    return null
  }

  // Handle edge cases
  if (fromValue === 0) {
    // Can't calculate percentage change from 0, but we can show if new value is positive/negative
    return toValue !== 0 ? (toValue > 0 ? Infinity : -Infinity) : null
  }

  if (fromValue === toValue) {
    return 0
  }

  // Calculate percentage change: ((new - old) / old) * 100
  return ((toValue - fromValue) / Math.abs(fromValue)) * 100
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
