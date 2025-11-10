import manifest from './logos-manifest.json'

export interface LogoStyle {
  slug: string
  title: string
  background: string
  scale: number
}

const LOGOS_DIR = '/logos/web' as const

// Hardcoded transforms for special cases and vendor-specific naming
const TRANSFORMS: Record<string, string> = {
  'google-ai-studio': 'aistudio',
  'google-vertex': 'vertexai',
  'amazon-bedrock': 'bedrock',
}

/**
 * Try to find the best matching logo from our manifest for a given input slug.
 */
function resolveLogo(slug: string): LogoStyle | undefined {
  if (!slug) return undefined

  const logos = new Map<string, LogoStyle>(Object.entries(manifest.logos))
  const logoKeys = Array.from(logos.keys())

  // Split namespaces (e.g., "openai/gpt-4o") and try most specific first
  const parts = slug.toLowerCase().split('/').reverse()

  for (const raw of parts) {
    const transformed = TRANSFORMS[raw] ?? raw

    // 1) Exact
    if (logos.has(transformed)) {
      return logos.get(transformed)
    }

    // 2) Prefix: transformed starts with a logo key
    const prefixMatch = logoKeys.find((key) => transformed.startsWith(key))
    if (prefixMatch) {
      return logos.get(prefixMatch)
    }

    // 3) Remove dashes and try prefix again
    const noDash = transformed.replace(/-/g, '')
    const noDashMatch = logoKeys.find((key) => noDash.startsWith(key))
    if (noDashMatch) {
      return logos.get(noDashMatch)
    }

    // 4) Truncate at first dash and try prefix again
    const base = transformed.replace(/-.*/, '')
    const baseMatch = logoKeys.find((key) => base.startsWith(key))
    if (baseMatch) {
      return logos.get(baseMatch)
    }
  }

  return undefined
}

/**
 * Get logo URL and style data for a given slug
 */
export function getLogo(slug: string) {
  const style = resolveLogo(slug)
  const url = style ? `${LOGOS_DIR}/${style.slug}.png` : undefined
  return { url, style }
}
