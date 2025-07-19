import { BrandIcon } from '../brand-icon/brand-icon'

export function ProviderLogoTitle({ slug, name }: { slug: string; name: string }) {
  return (
    <div className={'flex items-center gap-2.5 text-base font-medium'}>
      <BrandIcon slug={slug} size={18} />
      {name}
    </div>
  )
}
