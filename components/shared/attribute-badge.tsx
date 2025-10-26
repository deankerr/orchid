import type { VariantProps } from 'class-variance-authority'

import { Doc } from '@/convex/_generated/dataModel'

import { AttributeName, attributes, getEndpointAttributeData } from '@/lib/attributes'
import type { SpriteIconName } from '@/lib/sprite-icons'

import { SpriteIcon } from '../ui/sprite-icon'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { RadBadge, RadIconBadge } from './rad-badge'

export function AttributeBadge({
  sprite,
  name,
  details,
  detailsValue,
  color,
  variant = 'surface',
  disabled,
}: {
  sprite: SpriteIconName
  name: string
  details: string
  detailsValue?: string
  color: VariantProps<typeof RadBadge>['color']
  variant?: VariantProps<typeof RadBadge>['variant']
  disabled?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <RadIconBadge variant={variant} color={color} aria-label={name} aria-disabled={disabled}>
          <SpriteIcon name={sprite} className="size-full" />
        </RadIconBadge>
      </TooltipTrigger>
      <TooltipContent className="max-w-60 font-mono">
        <div className="space-y-1">
          <p className="font-medium uppercase">{name}</p>
          <p className="font-sans">{details}</p>
          {detailsValue && <p className="">{detailsValue}</p>}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export function AttributeBadgeName({ name }: { name: AttributeName }) {
  const attr = attributes[name]
  return (
    <AttributeBadge
      sprite={attr.icon}
      name={name}
      details={attr.details}
      color={attr.color}
      disabled={!attr.has}
    />
  )
}

export function AttributeBadgeSet({
  endpoint,
  attributes,
  hideUnavailable = false,
}: {
  endpoint: Doc<'or_views_endpoints'>
  attributes: AttributeName[]
  hideUnavailable?: boolean
}) {
  const data = attributes.map((attr) => getEndpointAttributeData(endpoint, attr))
  const pdata = processPairs(data)

  return (
    <div className="flex items-center justify-center gap-1">
      {pdata.map((attr) =>
        attr.has ? (
          <AttributeBadge
            key={attr.name}
            sprite={attr.icon}
            name={attr.name}
            details={attr.details}
            detailsValue={attr.value}
            color={attr.color}
            variant={attr.variant}
            disabled={!attr.has}
          />
        ) : hideUnavailable ? null : (
          <div key={attr.name} className="size-7 shrink-0" />
        ),
      )}
    </div>
  )
}

const pairs = [
  ['reasoning', 'mandatory_reasoning'],
  ['response_format', 'structured_outputs'],
  ['caching', 'implicit_caching'],
]

function processPairs<T extends { name: string; has: boolean }>(attributeData: T[]) {
  const map = new Map(attributeData.map((attr) => [attr.name, attr]))
  for (const [a1, a2] of pairs) {
    if (map.get(a2)?.has) map.delete(a1)
    else map.delete(a2)
  }
  return [...map.values()]
}
