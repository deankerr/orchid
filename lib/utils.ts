import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatIsoDate(timestamp: number) {
  return new Date(timestamp).toISOString().split('T')[0]
}

export function formatTokenPriceToM(value = 0) {
  return `$${(value * 1_000_000).toFixed(2)}/M`
}

export function formatTokenPriceToK(value = 0) {
  return `$${(value * 1_000).toFixed(2)}/K`
}
