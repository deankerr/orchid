import type { Doc } from '@/convex/_generated/dataModel'

import { formatPrice } from '@/lib/formatters'

import { AttributeBadge } from './attribute-badge'

export type PricingBadgeProps = {
  endpoint: Doc<'or_views_endpoints'>
}

export function PricingBadgeSet({ endpoint }: PricingBadgeProps) {
  const pricing = endpoint.pricing
  const pricingItems = []

  // Internal reasoning pricing
  if (pricing.internal_reasoning) {
    pricingItems.push(
      <AttributeBadge
        key="internal_reasoning"
        icon="brain-cog"
        name="internal_reasoning"
        details={formatPrice({
          priceKey: 'internal_reasoning',
          priceValue: pricing.internal_reasoning,
        })}
        color="blue"
      />,
    )
  }

  // Image input pricing
  if (pricing.image_input) {
    pricingItems.push(
      <AttributeBadge
        key="image_input"
        icon="image"
        name="image_input"
        details={formatPrice({
          priceKey: 'image_input',
          priceValue: pricing.image_input,
        })}
        color="purple"
      />,
    )
  }

  // Image output pricing
  if (pricing.image_output) {
    pricingItems.push(
      <AttributeBadge
        key="image_output"
        icon="image"
        name="image_output"
        details={formatPrice({
          priceKey: 'image_output',
          priceValue: pricing.image_output,
        })}
        color="purple"
      />,
    )
  }

  // Audio pricing (combined input and cache input)
  if (pricing.audio_input || pricing.audio_cache_input) {
    const audioDetails = []

    // Regular audio input
    if (pricing.audio_input) {
      audioDetails.push(
        `Input: ${formatPrice({
          priceKey: 'audio_input',
          priceValue: pricing.audio_input,
        })}`,
      )
    }

    // Audio cache input
    if (pricing.audio_cache_input) {
      audioDetails.push(
        `Cache: ${formatPrice({
          priceKey: 'audio_cache_input',
          priceValue: pricing.audio_cache_input,
        })}`,
      )
    }

    pricingItems.push(
      <AttributeBadge
        key="audio"
        icon="audio-lines"
        name="audio"
        details={audioDetails.join('\n')}
        color="green"
      />,
    )
  }

  // Cache pricing (combined read and write)
  if (pricing.cache_read) {
    const cacheDetails = []

    // Cache read is required
    cacheDetails.push(
      `Read: ${formatPrice({
        priceKey: 'cache_read',
        priceValue: pricing.cache_read,
      })}`,
    )

    // Cache write is optional
    if (pricing.cache_write) {
      cacheDetails.push(
        `Write: ${formatPrice({
          priceKey: 'cache_write',
          priceValue: pricing.cache_write,
        })}`,
      )
    }

    pricingItems.push(
      <AttributeBadge
        key="cache"
        icon="database"
        name="cache"
        details={cacheDetails.join('\n')}
        color="cyan"
      />,
    )
  }

  // Request pricing
  if (pricing.request) {
    pricingItems.push(
      <AttributeBadge
        key="request"
        icon="flag"
        name="request"
        details={formatPrice({
          priceKey: 'request',
          priceValue: pricing.request,
        })}
        color="yellow"
      />,
    )
  }

  if (pricingItems.length === 0) {
    return null
  }

  return <div className="flex flex-wrap gap-1">{pricingItems}</div>
}
