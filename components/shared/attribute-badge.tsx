import type { VariantProps } from 'class-variance-authority'
import { type LucideIcon } from 'lucide-react'

import { Doc } from '@/convex/_generated/dataModel'

import { AttributeName, attributes, getEndpointAttributeData } from '@/lib/attributes'

import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { RadBadge } from './rad-badge'

export function AttributeBadge({
  icon: Icon,
  name,
  details,
  detailsValue,
  color,
  variant = 'surface',
  disabled,
}: {
  icon: LucideIcon
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
        <RadBadge
          className="size-7 shrink-0 px-1 py-1 font-mono uppercase aria-disabled:opacity-20 aria-disabled:saturate-[20%] [&>svg]:size-full"
          variant={variant}
          color={color}
          aria-label={name}
          aria-disabled={disabled}
        >
          <Icon />
        </RadBadge>
      </TooltipTrigger>

      <TooltipContent>
        <div className="space-y-1">
          <div className="font-mono font-medium uppercase">{name}</div>
          <div>{details}</div>
          {detailsValue !== undefined && (
            <div className="font-mono font-medium">{detailsValue}</div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export function AttributeBadgeName({ name }: { name: AttributeName }) {
  const attr = attributes[name]
  return (
    <AttributeBadge
      icon={attr.icon}
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
}: {
  endpoint: Doc<'or_views_endpoints'>
  attributes: AttributeName[]
}) {
  const data = attributes.map((attr) => getEndpointAttributeData(endpoint, attr))
  const pdata = processPairs(data)

  return (
    <div className="flex gap-1">
      {pdata.map((attr) => (
        <AttributeBadge
          key={attr.name}
          icon={attr.icon}
          name={attr.name}
          details={attr.details}
          detailsValue={attr.value}
          color={attr.color}
          variant={attr.variant}
          disabled={!attr.has}
        />
      ))}
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
