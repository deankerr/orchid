import { RadBadge } from '@/components/shared/rad-badge'

import { ComponentFrame } from '../component-frame'
import { ComponentSection } from '../component-section'

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
  'API Key',
  'Model ID',
  'Provider',
  'Endpoint',
  'Pricing',
  'Context',
  'Features',
  'Premium',
  'Beta',
  'Stable',
  'Deprecated',
  'New',
] as const

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
  'neutral',
  'stone',
] as const

const variants = ['solid', 'soft', 'surface', 'outline'] as const

export function RadBadgeComponents() {
  return (
    <>
      {colors.map((color) => (
        <ComponentSection
          key={color}
          title={`${color.charAt(0).toUpperCase() + color.slice(1)} Palette`}
          description={`All RadBadge variants using ${color} color scheme`}
        >
          {variants.map((variant, variantIndex) => (
            <ComponentFrame
              key={variant}
              title={`${variant.charAt(0).toUpperCase() + variant.slice(1)}`}
              description={`${color} ${variant} variant`}
            >
              <RadBadge variant={variant} color={color}>
                {valueTokens[(variants.length + variantIndex) % valueTokens.length]}
              </RadBadge>
            </ComponentFrame>
          ))}
        </ComponentSection>
      ))}
    </>
  )
}
