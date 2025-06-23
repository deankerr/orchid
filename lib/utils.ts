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

export function formatTimestampToYMDHM(timestamp: number) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hour}:${minute}`
}
