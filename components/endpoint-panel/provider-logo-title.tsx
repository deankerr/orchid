import { BrandIcon } from '../shared/brand-icon'

export function ProviderLogoTitle({ icon_url, name }: { icon_url?: string; name: string }) {
  return (
    <div className={'flex items-center gap-2.5 text-base font-medium'}>
      <BrandIcon url={icon_url} size={18} />
      {name}
    </div>
  )
}
