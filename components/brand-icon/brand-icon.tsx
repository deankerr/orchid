import Image from 'next/image'

import { BoxIcon } from 'lucide-react'

export function BrandIcon({
  url,
  alt = '',
  size = 20,
}: {
  url?: string
  alt?: string
  size?: number
}) {
  return (
    <div style={{ width: size, height: size }} className={'relative flex flex-none rounded-lg'}>
      {url ? (
        <Image src={url} alt={alt} fill sizes={`${size}px`} style={{ objectFit: 'contain' }} />
      ) : (
        <BoxIcon className="m-auto size-full opacity-95" strokeWidth={1.5} />
      )}
    </div>
  )
}
