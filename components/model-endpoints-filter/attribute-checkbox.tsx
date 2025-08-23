import { cn } from '@/lib/utils'

import { attributes, type AttributeKey } from '../attributes'
import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'

export function AttributeCheckbox({
  attributeKey,
  checked,
  onChange,
}: {
  attributeKey: AttributeKey
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  const config = attributes[attributeKey]
  const id = `filter-${attributeKey}`

  return (
    <Label
      htmlFor={id}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-sm border border-input px-2.5 py-1.5 font-mono text-sm font-medium whitespace-nowrap text-muted-foreground uppercase transition-colors select-none hover:bg-input/30 hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50',
        checked ? 'bg-input/30 text-accent-foreground' : '',
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(checked) => onChange(checked === true)}
        className="mr-1 h-4 w-4"
      />
      <span className="flex-shrink-0 [&>svg]:size-3.5">{config.icon}</span>
      {config.label}
    </Label>
  )
}
