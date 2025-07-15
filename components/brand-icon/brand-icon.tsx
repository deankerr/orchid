import { memo } from 'react'
import Image from 'next/image'

import { BoxIcon } from 'lucide-react'

import { useProvidersList } from '@/hooks/api'

import LobeIconSlugs from './lobe-icon-slugs.json'

const lobeIconSlugs = [...LobeIconSlugs.color, ...LobeIconSlugs.monochrome]

function transformSlug(slug: string) {
  switch (slug) {
    case 'google-ai-studio':
      return 'aistudio'

    case 'google-vertex':
      return 'vertexai'

    case 'amazon-bedrock':
      return 'bedrock'

    default:
      return slug
  }
}

function getIconSlug(slug: string) {
  return slug
    .split('/')
    .reverse()
    .map(transformSlug)
    .map((s) => {
      const match =
        lobeIconSlugs.find((l) => s.startsWith(l)) ??
        lobeIconSlugs.find((l) => s.replace('-', '').startsWith(l)) ?? // remove dash
        lobeIconSlugs.find((l) => s.replace(/-.*$/, '').startsWith(l)) // truncate at first dash

      if (match) {
        return LobeIconSlugs.color.includes(match) ? `${match}-color` : match
      }
    })
    .find((s) => s)
}

function LobeIcon({ slug, size, alt = '' }: { slug: string; size: number; alt?: string }) {
  return (
    <>
      <Image
        src={`https://unpkg.com/@lobehub/icons-static-png@latest/dark/${slug}.png`}
        alt={alt}
        fill
        sizes={`${size}px`}
        style={{ objectFit: 'contain' }}
        className="hidden dark:block"
      />
      <Image
        src={`https://unpkg.com/@lobehub/icons-static-png@latest/light/${slug}.png`}
        alt={alt}
        fill
        sizes={`${size}px`}
        style={{ objectFit: 'contain' }}
        className="block dark:hidden"
      />
    </>
  )
}

function FallbackIcon({
  slug,
  alt = '',
  size = 20,
}: {
  slug: string
  alt?: string
  size?: number
}) {
  const providers = useProvidersList()

  const url = slug
    .split('/')
    .map((s) => providers?.find((p) => p.slug === s)?.icon.url)
    .find((s) => s)

  if (url) {
    return <Image src={url} alt={alt} fill sizes={`${size}px`} style={{ objectFit: 'contain' }} />
  }

  if (providers && !url) {
    return <BoxIcon className="m-auto opacity-95" strokeWidth={1.5} />
  }
}

function BrandIcon_({ slug, alt = '', size = 20 }: { slug: string; alt?: string; size?: number }) {
  const lobeIconSlug = getIconSlug(slug)

  return (
    <div style={{ width: size, height: size }} className={'relative flex flex-none rounded-lg'}>
      {lobeIconSlug ? (
        <LobeIcon slug={lobeIconSlug} size={size} alt={alt} />
      ) : (
        <FallbackIcon slug={slug} size={size} alt={alt} />
      )}
    </div>
  )
}

export const BrandIcon = memo(BrandIcon_)
