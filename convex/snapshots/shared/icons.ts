import IconsManifest from './icon-manifest.json'

const PUBLIC_ICONS_DIR = 'icons'

// Hardcoded transforms for special cases and vendor-specific naming
// Add entries here as needed when we encounter mismatches.
const TRANSFORMS: Record<string, string> = {
  'google-ai-studio': 'aistudio',
  'google-vertex': 'vertexai',
  'amazon-bedrock': 'bedrock',
}

const icons = IconsManifest.icons

// Try to find the best matching icon slug from our manifest for a given input slug.
// Returns a slug present in the manifest, or undefined if no reasonable match is found.
function resolveIconSlug(slug: string) {
  if (!slug) return undefined

  // Split namespaces (e.g., "openai/gpt-4o") and try most specific first
  const parts = slug.toLowerCase().split('/').reverse()

  for (const raw of parts) {
    const transformed = TRANSFORMS[raw] ?? raw

    // 1) Exact
    if (icons.includes(transformed)) return transformed

    // 2) Prefix: raw starts with an icon
    const prefixMatch = icons.find((i) => transformed.startsWith(i))
    if (prefixMatch) return prefixMatch

    // 3) Remove dashes and try prefix again
    const noDash = transformed.replace(/-/g, '')
    const noDashMatch = icons.find((i) => noDash.startsWith(i))
    if (noDashMatch) return noDashMatch

    // 4) Truncate at first dash and try prefix again
    const base = transformed.replace(/-.*/, '')
    const baseMatch = icons.find((i) => base.startsWith(i))
    if (baseMatch) return baseMatch
  }

  return undefined
}

export function getIconUrl(slug: string) {
  const iconSlug = resolveIconSlug(slug)
  if (!iconSlug) return undefined

  return `/${PUBLIC_ICONS_DIR}/32/${iconSlug}.png`
}
