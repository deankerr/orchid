import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatIsoDate(date: number) {
  return new Date(date).toISOString().split('T')[0]
}

/**
 * Calculate percentage change between two numeric values
 * Returns null if either value is not a number or if old value is 0
 * Handles both numbers and strings by parsing strings first
 */
export function calculatePercentageChange(from: unknown, to: unknown): number | null {
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

export function formatTimestampToYMDHM(timestamp: number) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hour}:${minute}`
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
