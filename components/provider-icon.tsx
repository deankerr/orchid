import React from 'react'
import Image from 'next/image'

import { useOrProviders } from '@/hooks/api'
import { cn } from '@/lib/utils'

import iconSlugs from './icons.json'

function findMatchingIcon(slug: string) {
  // Try to find a color version first
  const colorSlug = `${slug}-color`
  if (iconSlugs.includes(colorSlug)) {
    return colorSlug
  }

  // Fall back to the exact slug
  if (iconSlugs.includes(slug)) {
    return slug
  }

  return null
}

export default function ProviderIcon({
  provider,
  alt = '',
  size = 20,
  className = '',
}: {
  provider: string
  alt?: string
  size?: number
  className?: string
}) {
  const slug = provider.split('/')[0]

  const providers = useOrProviders()
  const found = providers?.find((p) => p.slug.startsWith(slug))
  const apiIconSrc = found?.icon.url
  const matchedLobeIcon = findMatchingIcon(slug)

  if (!apiIconSrc) return null
  return (
    <div
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      className={cn('relative flex-none overflow-hidden rounded-lg', className)}
    >
      {matchedLobeIcon ? (
        // Use LobeHub icon with theme detection
        <>
          <Image
            src={`https://unpkg.com/@lobehub/icons-static-png@latest/dark/${matchedLobeIcon}.png`}
            alt={alt}
            fill
            sizes={`${size}px`}
            style={{ objectFit: 'contain' }}
            className="hidden dark:block"
          />
          <Image
            src={`https://unpkg.com/@lobehub/icons-static-png@latest/light/${matchedLobeIcon}.png`}
            alt={alt}
            fill
            sizes={`${size}px`}
            style={{ objectFit: 'contain' }}
            className="block dark:hidden"
          />
        </>
      ) : (
        // Fallback to provider API icon
        apiIconSrc && (
          <Image
            src={apiIconSrc}
            alt={alt}
            fill
            sizes={`${size}px`}
            style={{ objectFit: 'contain' }}
          />
        )
      )}
    </div>
  )
}
