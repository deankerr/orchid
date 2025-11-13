import { RadBadge } from '@/components/shared/rad-badge'
import { Badge } from '@/components/ui/badge'

const colors = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
  'gray',
  'slate',
  'zinc',
  'stone',
  'neutral',
] as const

const variants = ['solid', 'soft', 'surface', 'outline'] as const

export function DemoRadBadgeComponents() {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => (
        <div key={color} className="flex shrink-0 flex-col gap-3 py-4">
          {variants.map((variant) => (
            <RadBadge
              key={variant}
              variant={variant}
              color={color}
              className="px-2 py-0.5 text-sm font-medium capitalize"
            >
              {variant}
            </RadBadge>
          ))}
        </div>
      ))}

      <div className="flex shrink-0 flex-col gap-3 py-4 [&>span]:text-sm">
        <Badge variant="secondary">Secondary</Badge>
        <Badge>Default</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Destructive</Badge>
      </div>
    </div>
  )
}
