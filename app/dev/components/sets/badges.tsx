import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import { ComponentFrame } from '../component-frame'
import { ComponentSection } from '../component-section'

// Custom badge component for exploration
function TechBadge({ children, className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn('inline-flex items-center rounded px-2 py-1 text-xs font-medium', className)}
      {...props}
    >
      {children}
    </span>
  )
}

const valueTokens = [
  'Status',
  '$0.64/MTOK',
  'claude-sonnet-3.5',
  '$14.20',
  'Vertex',
  '64K CTX',
  'Unknown',
  '1,000,000',
  'Free',
  'privacyPolicyURL',
  '$1.65/MTOK',
  'true',
] as const

const colors = [
  'gray',
  'slate',
  'zinc',
  'neutral',
  'stone',
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
] as const
type Color = (typeof colors)[number]

// Future: migrate to CSS custom properties using @theme directive
// Example:
// @theme {
//   --color-badge-red-primary: theme('colors.red.600');
//   --color-badge-red-muted: theme('colors.red.950');
//   /* etc... */
// }

const monoTokens = {
  gray: {
    solidBg: 'bg-gray-600',
    solidText: 'text-white',
    softBg: 'bg-gray-900',
    softText: 'text-gray-300',
    surfaceBg: 'bg-gray-900/50',
    surfaceText: 'text-gray-300',
    surfaceBorder: 'border-gray-800',
    outlineText: 'text-gray-400',
    outlineBorder: 'border-gray-600',
  },
  slate: {
    solidBg: 'bg-slate-600',
    solidText: 'text-white',
    softBg: 'bg-slate-900',
    softText: 'text-slate-300',
    surfaceBg: 'bg-slate-900/50',
    surfaceText: 'text-slate-300',
    surfaceBorder: 'border-slate-800',
    outlineText: 'text-slate-400',
    outlineBorder: 'border-slate-600',
  },
  zinc: {
    solidBg: 'bg-zinc-600',
    solidText: 'text-white',
    softBg: 'bg-zinc-900',
    softText: 'text-zinc-300',
    surfaceBg: 'bg-zinc-900/50',
    surfaceText: 'text-zinc-300',
    surfaceBorder: 'border-zinc-800',
    outlineText: 'text-zinc-400',
    outlineBorder: 'border-zinc-600',
  },
  neutral: {
    solidBg: 'bg-neutral-600',
    solidText: 'text-white',
    softBg: 'bg-neutral-900',
    softText: 'text-neutral-300',
    surfaceBg: 'bg-neutral-900/50',
    surfaceText: 'text-neutral-300',
    surfaceBorder: 'border-neutral-800',
    outlineText: 'text-neutral-400',
    outlineBorder: 'border-neutral-600',
  },
  stone: {
    solidBg: 'bg-stone-600',
    solidText: 'text-white',
    softBg: 'bg-stone-900',
    softText: 'text-stone-300',
    surfaceBg: 'bg-stone-900/50',
    surfaceText: 'text-stone-300',
    surfaceBorder: 'border-stone-800',
    outlineText: 'text-stone-400',
    outlineBorder: 'border-stone-600',
  },
}

const colorTokens = {
  red: {
    solidBg: 'bg-red-600',
    solidText: 'text-white',
    softBg: 'bg-red-950',
    softText: 'text-red-400',
    surfaceBg: 'bg-red-950/30',
    surfaceText: 'text-red-400',
    surfaceBorder: 'border-red-400/30',
    outlineText: 'text-red-400',
    outlineBorder: 'border-red-400',
  },
  orange: {
    solidBg: 'bg-orange-600',
    solidText: 'text-white',
    softBg: 'bg-orange-950',
    softText: 'text-orange-400',
    surfaceBg: 'bg-orange-950/30',
    surfaceText: 'text-orange-400',
    surfaceBorder: 'border-orange-400/30',
    outlineText: 'text-orange-400',
    outlineBorder: 'border-orange-400',
  },
  amber: {
    solidBg: 'bg-amber-600',
    solidText: 'text-white',
    softBg: 'bg-amber-950',
    softText: 'text-amber-400',
    surfaceBg: 'bg-amber-950/30',
    surfaceText: 'text-amber-400',
    surfaceBorder: 'border-amber-400/30',
    outlineText: 'text-amber-400',
    outlineBorder: 'border-amber-400',
  },
  yellow: {
    solidBg: 'bg-yellow-600',
    solidText: 'text-white',
    softBg: 'bg-yellow-950',
    softText: 'text-yellow-400',
    surfaceBg: 'bg-yellow-950/30',
    surfaceText: 'text-yellow-400',
    surfaceBorder: 'border-yellow-400/30',
    outlineText: 'text-yellow-400',
    outlineBorder: 'border-yellow-400',
  },
  lime: {
    solidBg: 'bg-lime-600',
    solidText: 'text-white',
    softBg: 'bg-lime-950',
    softText: 'text-lime-400',
    surfaceBg: 'bg-lime-950/30',
    surfaceText: 'text-lime-400',
    surfaceBorder: 'border-lime-400/30',
    outlineText: 'text-lime-400',
    outlineBorder: 'border-lime-400',
  },
  green: {
    solidBg: 'bg-green-600',
    solidText: 'text-white',
    softBg: 'bg-green-950',
    softText: 'text-green-400',
    surfaceBg: 'bg-green-950/30',
    surfaceText: 'text-green-400',
    surfaceBorder: 'border-green-400/30',
    outlineText: 'text-green-400',
    outlineBorder: 'border-green-400',
  },
  emerald: {
    solidBg: 'bg-emerald-600',
    solidText: 'text-white',
    softBg: 'bg-emerald-950',
    softText: 'text-emerald-400',
    surfaceBg: 'bg-emerald-950/30',
    surfaceText: 'text-emerald-400',
    surfaceBorder: 'border-emerald-400/30',
    outlineText: 'text-emerald-400',
    outlineBorder: 'border-emerald-400',
  },
  teal: {
    solidBg: 'bg-teal-600',
    solidText: 'text-white',
    softBg: 'bg-teal-950',
    softText: 'text-teal-400',
    surfaceBg: 'bg-teal-950/30',
    surfaceText: 'text-teal-400',
    surfaceBorder: 'border-teal-400/30',
    outlineText: 'text-teal-400',
    outlineBorder: 'border-teal-400',
  },
  cyan: {
    solidBg: 'bg-cyan-600',
    solidText: 'text-white',
    softBg: 'bg-cyan-950',
    softText: 'text-cyan-400',
    surfaceBg: 'bg-cyan-950/30',
    surfaceText: 'text-cyan-400',
    surfaceBorder: 'border-cyan-400/30',
    outlineText: 'text-cyan-400',
    outlineBorder: 'border-cyan-400',
  },
  sky: {
    solidBg: 'bg-sky-600',
    solidText: 'text-white',
    softBg: 'bg-sky-950',
    softText: 'text-sky-400',
    surfaceBg: 'bg-sky-950/30',
    surfaceText: 'text-sky-400',
    surfaceBorder: 'border-sky-400/30',
    outlineText: 'text-sky-400',
    outlineBorder: 'border-sky-400',
  },
  blue: {
    solidBg: 'bg-blue-600',
    solidText: 'text-white',
    softBg: 'bg-blue-950',
    softText: 'text-blue-400',
    surfaceBg: 'bg-blue-950/30',
    surfaceText: 'text-blue-400',
    surfaceBorder: 'border-blue-400/30',
    outlineText: 'text-blue-400',
    outlineBorder: 'border-blue-400',
  },
  indigo: {
    solidBg: 'bg-indigo-600',
    solidText: 'text-white',
    softBg: 'bg-indigo-950',
    softText: 'text-indigo-400',
    surfaceBg: 'bg-indigo-950/30',
    surfaceText: 'text-indigo-400',
    surfaceBorder: 'border-indigo-400/30',
    outlineText: 'text-indigo-400',
    outlineBorder: 'border-indigo-400',
  },
  violet: {
    solidBg: 'bg-violet-600',
    solidText: 'text-white',
    softBg: 'bg-violet-950',
    softText: 'text-violet-400',
    surfaceBg: 'bg-violet-950/30',
    surfaceText: 'text-violet-400',
    surfaceBorder: 'border-violet-400/30',
    outlineText: 'text-violet-400',
    outlineBorder: 'border-violet-400',
  },
  purple: {
    solidBg: 'bg-purple-600',
    solidText: 'text-white',
    softBg: 'bg-purple-950',
    softText: 'text-purple-400',
    surfaceBg: 'bg-purple-950/30',
    surfaceText: 'text-purple-400',
    surfaceBorder: 'border-purple-400/30',
    outlineText: 'text-purple-400',
    outlineBorder: 'border-purple-400',
  },
  fuchsia: {
    solidBg: 'bg-fuchsia-600',
    solidText: 'text-white',
    softBg: 'bg-fuchsia-950',
    softText: 'text-fuchsia-400',
    surfaceBg: 'bg-fuchsia-950/30',
    surfaceText: 'text-fuchsia-400',
    surfaceBorder: 'border-fuchsia-400/30',
    outlineText: 'text-fuchsia-400',
    outlineBorder: 'border-fuchsia-400',
  },
  pink: {
    solidBg: 'bg-pink-600',
    solidText: 'text-white',
    softBg: 'bg-pink-950',
    softText: 'text-pink-400',
    surfaceBg: 'bg-pink-950/30',
    surfaceText: 'text-pink-400',
    surfaceBorder: 'border-pink-400/30',
    outlineText: 'text-pink-400',
    outlineBorder: 'border-pink-400',
  },
  rose: {
    solidBg: 'bg-rose-600',
    solidText: 'text-white',
    softBg: 'bg-rose-950',
    softText: 'text-rose-400',
    surfaceBg: 'bg-rose-950/30',
    surfaceText: 'text-rose-400',
    surfaceBorder: 'border-rose-400/30',
    outlineText: 'text-rose-400',
    outlineBorder: 'border-rose-400',
  },
}

const badgeVariants = {
  solid: (color: Color) => {
    if (color in monoTokens) {
      const tokens = monoTokens[color as keyof typeof monoTokens]
      return `${tokens.solidBg} ${tokens.solidText}`
    }
    if (color in colorTokens) {
      const tokens = colorTokens[color as keyof typeof colorTokens]
      return `${tokens.solidBg} ${tokens.solidText}`
    }
    return ''
  },
  soft: (color: Color) => {
    if (color in monoTokens) {
      const tokens = monoTokens[color as keyof typeof monoTokens]
      return `${tokens.softBg} ${tokens.softText}`
    }
    if (color in colorTokens) {
      const tokens = colorTokens[color as keyof typeof colorTokens]
      return `${tokens.softBg} ${tokens.softText}`
    }
    return ''
  },
  surface: (color: Color) => {
    if (color in monoTokens) {
      const tokens = monoTokens[color as keyof typeof monoTokens]
      return `${tokens.surfaceBg} ${tokens.surfaceText} border ${tokens.surfaceBorder}`
    }
    if (color in colorTokens) {
      const tokens = colorTokens[color as keyof typeof colorTokens]
      return `${tokens.surfaceBg} ${tokens.surfaceText} border ${tokens.surfaceBorder}`
    }
    return ''
  },
  outline: (color: Color) => {
    if (color in monoTokens) {
      const tokens = monoTokens[color as keyof typeof monoTokens]
      return `border ${tokens.outlineBorder} ${tokens.outlineText}`
    }
    if (color in colorTokens) {
      const tokens = colorTokens[color as keyof typeof colorTokens]
      return `border ${tokens.outlineBorder} ${tokens.outlineText}`
    }
    return ''
  },
} as const

type BadgeVariant = keyof typeof badgeVariants

export function BadgeComponents() {
  const variants: BadgeVariant[] = ['solid', 'soft', 'surface', 'outline']

  return (
    <>
      <ComponentSection
        title="Original shadcn/ui Variants"
        description="Existing badge variants from the shadcn/ui component library"
      >
        <ComponentFrame title="Default" description="Original default variant">
          <Badge>Default</Badge>
        </ComponentFrame>

        <ComponentFrame title="Secondary" description="Original secondary variant">
          <Badge variant="secondary">Secondary</Badge>
        </ComponentFrame>

        <ComponentFrame title="Destructive" description="Original destructive variant">
          <Badge variant="destructive">Destructive</Badge>
        </ComponentFrame>

        <ComponentFrame title="Outline" description="Original outline variant">
          <Badge variant="outline">Outline</Badge>
        </ComponentFrame>
      </ComponentSection>

      {colors.map((color, colorIndex) => (
        <ComponentSection
          key={color}
          title={`${color.charAt(0).toUpperCase() + color.slice(1)} Palette`}
          description={`All badge variants using ${color} color scheme`}
        >
          {variants.map((variant, variantIndex) => (
            <ComponentFrame
              key={variant}
              title={variant.charAt(0).toUpperCase() + variant.slice(1).replace('-', ' ')}
              description={`${color} ${variant} variant`}
            >
              <TechBadge className={badgeVariants[variant](color)}>
                {valueTokens[(colorIndex * variants.length + variantIndex) % valueTokens.length]}
              </TechBadge>
            </ComponentFrame>
          ))}
        </ComponentSection>
      ))}

      <ComponentSection title="Misc" description="Experimental and special effect variants">
        <ComponentFrame title="Gradient" description="Gradient background effect">
          <TechBadge className="bg-linear-to-r from-blue-500 to-purple-600 text-white">
            {valueTokens[0]}
          </TechBadge>
        </ComponentFrame>

        <ComponentFrame title="Terminal" description="Terminal/monospace styling">
          <TechBadge className="border border-green-800 bg-black font-mono text-green-400">
            {valueTokens[1]}
          </TechBadge>
        </ComponentFrame>

        <ComponentFrame title="Neon" description="Neon glow effect">
          <TechBadge className="bg-cyan-500 font-bold text-black shadow-lg shadow-cyan-500/50">
            {valueTokens[2]}
          </TechBadge>
        </ComponentFrame>

        <ComponentFrame title="Retro" description="Retro computing aesthetic">
          <TechBadge className="border-2 border-amber-600 bg-amber-300 font-mono text-amber-900">
            {valueTokens[3]}
          </TechBadge>
        </ComponentFrame>

        <ComponentFrame title="Status Dot" description="With status indicator">
          <TechBadge className="flex items-center gap-1 bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            {valueTokens[4]}
          </TechBadge>
        </ComponentFrame>
      </ComponentSection>
    </>
  )
}
