import Image from 'next/image'

import { cn } from '@/lib/utils'

import lobeIconSlugs from './icons.json'

export function BrandIcon({
  slug,
  alt = '',
  size = 20,
  fallbackSrc,
  className = '',
}: {
  slug: string
  alt?: string
  size?: number
  fallbackSrc?: string
  className?: string
}) {
  const iconSlug = slug
    .split('/')
    .reverse()
    .map((s) => {
      const match =
        lobeIconSlugs.find((l) => s.startsWith(l)) ??
        lobeIconSlugs.find((l) => s.replace('-', '').startsWith(l)) ??
        lobeIconSlugs.find((l) => s.replace(/-.*$/, '').startsWith(l)) // truncate first hyphen
      return lobeIconSlugs.includes(`${match}-color`) ? `${match}-color` : match
    })
    .find((s) => s)

  return (
    <div
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      className={cn('relative flex flex-none rounded-lg', className)}
      title={slug}
    >
      {iconSlug ? (
        // Use LobeHub icon with theme detection
        <>
          <Image
            src={`https://unpkg.com/@lobehub/icons-static-png@latest/dark/${iconSlug}.png`}
            alt={alt}
            fill
            sizes={`${size}px`}
            style={{ objectFit: 'contain' }}
            className="hidden dark:block"
          />
          <Image
            src={`https://unpkg.com/@lobehub/icons-static-png@latest/light/${iconSlug}.png`}
            alt={alt}
            fill
            sizes={`${size}px`}
            style={{ objectFit: 'contain' }}
            className="block dark:hidden"
          />
        </>
      ) : fallbackSrc ? (
        <Image
          src={fallbackSrc}
          alt={alt}
          fill
          sizes={`${size}px`}
          style={{ objectFit: 'contain' }}
        />
      ) : (
        <div className="m-auto size-5/6 rounded-lg border dark:bg-muted/30" />
      )}
    </div>
  )
}
