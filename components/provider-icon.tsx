import React from 'react'
import Image from 'next/image'

import { useOrProviders } from '@/hooks/api'
import { cn } from '@/lib/utils'

export default function ProviderIcon({
  provider,
  alt = '',
  width = 20,
}: {
  provider: string
  alt?: string
  width?: number
}) {
  const providers = useOrProviders()
  const found = providers?.find((p) => p.slug === provider)
  const src = found?.icon.url

  const invertRequired = provider === 'openai' || provider === 'liquid'

  const w = width
  const h = width

  return (
    <div
      style={{ width: w, height: h, minWidth: w, minHeight: h, position: 'relative' }}
      className={cn('overflow-hidden rounded-lg', invertRequired && 'invert', !src && 'border')}
    >
      {src && <Image src={src} alt={alt} fill style={{ objectFit: 'contain' }} unoptimized />}
    </div>
  )
}
