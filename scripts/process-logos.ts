import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import sharp from 'sharp'

const LOBEHUB_STATIC_PNG = 'node_modules/@lobehub/icons-static-png/dark'
const LOBEHUB_ICONS = 'node_modules/@lobehub/icons/es'
const SOURCES_DIR = 'public/logos/sources/lobehub-icons'
const SOURCES_OTHER_DIR = 'public/logos/sources/other'
const SOURCES_OPENROUTER_DIR = 'public/logos/sources/openrouter'
const OUTPUT_DIR = 'public/logos/web'
const MANIFEST_FILE = 'lib/logos-manifest.json'

interface LogoStyle {
  slug: string
  title: string
  background: string
  scale: number
}

/**
 * Check if a color is white
 */
function isWhite(color: string): boolean {
  const normalized = color.toLowerCase()
  return normalized === '#fff' || normalized === '#ffffff' || normalized === 'white'
}

/**
 * Check if a color is black
 */
function isBlack(color: string): boolean {
  const normalized = color.toLowerCase()
  return normalized === '#000' || normalized === '#000000' || normalized === 'black'
}

/**
 * Check if a color needs tinting (not white or black)
 */
function needsTint(color: string): boolean {
  return !isWhite(color) && !isBlack(color)
}

/**
 * Check if icon needs inversion
 * - Invert when icon color matches background (both black or both white)
 * - Invert when avatarColor is black (source logos are white, need to invert to black)
 */
function needsInversion(avatarColor: string, background: string, useColor: boolean): boolean {
  // * If using color variant, no inversion needed
  if (useColor) return false

  const iconIsBlack = isBlack(avatarColor)
  const iconIsWhite = isWhite(avatarColor)
  const bgIsBlack = isBlack(background)
  const bgIsWhite = isWhite(background)

  // * Invert if colors match (low contrast)
  if ((iconIsBlack && bgIsBlack) || (iconIsWhite && bgIsWhite)) {
    return true
  }

  // * Invert if avatarColor is black (source logos are white, need black icon)
  if (iconIsBlack) {
    return true
  }

  return false
}

/**
 * Convert slug to title (capitalize words)
 */
function slugToTitle(slug: string): string {
  return slug
    .split(/(?=[A-Z])|[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Process other icons from sources/other directory
 */
async function processOtherIcons(existingSlugs: Set<string>): Promise<Record<string, LogoStyle>> {
  const styles: Record<string, LogoStyle> = {}

  try {
    const files = await readdir(SOURCES_OTHER_DIR)
    const iconFiles = files.filter((f) => f.endsWith('.png'))

    if (iconFiles.length === 0) {
      return styles
    }

    console.log(`\n📦 Processing ${iconFiles.length} other icons...\n`)

    for (const file of iconFiles) {
      const slug = file.replace(/\.png$/, '')

      // * Skip if already processed from lobehub
      if (existingSlugs.has(slug)) {
        continue
      }

      const title = slugToTitle(slug)
      const sourcePath = join(SOURCES_OTHER_DIR, file)
      const destPath = join(OUTPUT_DIR, file)

      try {
        await copyFile(sourcePath, destPath)
        styles[slug] = {
          slug,
          title,
          background: '', // Empty - will use fallback color in frontend
          scale: 1,
        }
        console.log(`  ✓ Added ${slug} (${title})`)
      } catch (err) {
        console.warn(`  ⚠️  Skipped ${slug}:`, err instanceof Error ? err.message : err)
      }
    }
  } catch (err) {
    // * Directory might not exist, that's okay
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn(`  ⚠️  Could not process other icons:`, err instanceof Error ? err.message : err)
    }
  }

  return styles
}

/**
 * Process icons from OpenRouter API
 */
async function processOpenRouterIcons(
  existingSlugs: Set<string>,
): Promise<Record<string, LogoStyle>> {
  const styles: Record<string, LogoStyle> = {}

  try {
    console.log(`\n🌐 Fetching providers from OpenRouter API...\n`)

    const response = await fetch('https://openrouter.ai/api/frontend/all-providers')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    const providers = data.data || []

    if (providers.length === 0) {
      return styles
    }

    await mkdir(SOURCES_OPENROUTER_DIR, { recursive: true })

    let downloadedCount = 0
    let skippedCount = 0

    for (const provider of providers) {
      const rawSlug = provider.slug
      const slug = rawSlug.replace(/-/g, '') // Remove dashes like lobehub icons
      const iconUrl = provider.icon?.url

      // * Skip if slug already exists
      if (existingSlugs.has(slug)) {
        continue
      }

      // * Skip if icon URL doesn't start with http
      if (!iconUrl || !iconUrl.startsWith('http')) {
        skippedCount++
        continue
      }

      try {
        // * Download icon image
        const iconResponse = await fetch(iconUrl)
        if (!iconResponse.ok) {
          throw new Error(`HTTP error! status: ${iconResponse.status}`)
        }

        const imageBuffer = await iconResponse.arrayBuffer()
        const destPath = join(SOURCES_OPENROUTER_DIR, `${slug}.png`)
        await writeFile(destPath, Buffer.from(imageBuffer))

        // * Copy to web directory
        const webDestPath = join(OUTPUT_DIR, `${slug}.png`)
        await copyFile(destPath, webDestPath)

        const title = slugToTitle(slug)
        styles[slug] = {
          slug,
          title,
          background: '', // Empty - will use fallback color in frontend
          scale: 1,
        }

        console.log(`  ✓ Downloaded ${slug}.png (${title})`)
        downloadedCount++
      } catch (err) {
        skippedCount++
        console.warn(`  ⚠️  Skipped ${slug}:`, err instanceof Error ? err.message : err)
      }
    }

    if (downloadedCount > 0) {
      console.log(`\n  📥 Downloaded ${downloadedCount} icons from OpenRouter`)
    }
    if (skippedCount > 0) {
      console.log(`  ⏭️  Skipped ${skippedCount} providers`)
    }
  } catch (err) {
    // * API might be unavailable, that's okay
    console.warn(
      `  ⚠️  Could not fetch OpenRouter icons:`,
      err instanceof Error ? err.message : err,
    )
  }

  return styles
}

/**
 * Extract style metadata and process logos
 */
async function processLogos() {
  console.log('🎨 Processing logos from @lobehub/icons...')

  await mkdir(SOURCES_DIR, { recursive: true })
  await mkdir(OUTPUT_DIR, { recursive: true })

  const dirs = await readdir(LOBEHUB_ICONS, { withFileTypes: true })
  const iconDirs = dirs.filter(
    (d) => d.isDirectory() && !['components', 'features', 'hooks', 'types'].includes(d.name),
  )

  const styles: Record<string, LogoStyle> = {}
  let processedCount = 0
  let tintedCount = 0
  let skippedCount = 0

  for (const dir of iconDirs) {
    const componentName = dir.name
    const slug = componentName.toLowerCase()
    const stylePath = join(LOBEHUB_ICONS, componentName, 'style.js')
    const avatarPath = join(LOBEHUB_ICONS, componentName, 'components', 'Avatar.js')

    try {
      const styleContent = await readFile(stylePath, 'utf-8')
      const avatarContent = await readFile(avatarPath, 'utf-8').catch(() => '')

      // * Extract style constants
      const title = styleContent.match(/export var TITLE = ['"](.+?)['"]/)?.[1]
      const avatarBackgroundRaw = styleContent.match(/export var AVATAR_BACKGROUND = (.+?);/)?.[1]
      const avatarColor = styleContent.match(/export var AVATAR_COLOR = ['"](.+?)['"]/)?.[1]
      const avatarIconScale = styleContent.match(/export var AVATAR_ICON_MULTIPLE = ([\d.]+)/)?.[1]
      const colorPrimary = styleContent.match(/export var COLOR_PRIMARY = ['"](.+?)['"]/)?.[1]
      const colorGradient = styleContent.match(/export var COLOR_GRADIENT = ['"](.+?)['"]/)?.[1]

      if (!title || !avatarBackgroundRaw || !avatarColor) continue

      // * Determine which logo variant to use
      const useColor = /import\s+Color\s+from\s+['"]\.\/(Color|Color\.js)['"]/.test(avatarContent)

      // * Save raw extracted values as JSON
      const rawStyleData = {
        slug,
        componentName,
        title,
        avatarBackgroundRaw,
        avatarColor,
        avatarIconScale: avatarIconScale || null,
        colorPrimary: colorPrimary || null,
        colorGradient: colorGradient || null,
        useColor,
        extractedAt: new Date().toISOString(),
      }
      const styleJsonPath = join(SOURCES_DIR, `${slug}.json`)
      await writeFile(styleJsonPath, JSON.stringify(rawStyleData, null, 2))

      // * Resolve background (prefer gradient if available)
      let background: string
      if (avatarBackgroundRaw === 'COLOR_PRIMARY') {
        background = colorPrimary!
      } else if (avatarBackgroundRaw === 'COLOR_GRADIENT') {
        background = colorGradient || colorPrimary || '#000'
      } else {
        background = avatarBackgroundRaw.replace(/['"]/g, '')
      }

      // * Check if inversion is needed
      const needsInvert = needsInversion(avatarColor, background, useColor)

      const sourceName = useColor ? `${slug}-color.png` : `${slug}.png`
      const sourcePath = join(LOBEHUB_STATIC_PNG, sourceName)
      const sourceDestPath = join(SOURCES_DIR, sourceName)
      const webDestPath = join(OUTPUT_DIR, `${slug}.png`)

      // * Copy source logo to sources directory
      await copyFile(sourcePath, sourceDestPath)

      // * Update JSON with inversion flag
      const updatedStyleData = { ...rawStyleData, needsInvert }
      await writeFile(styleJsonPath, JSON.stringify(updatedStyleData, null, 2))

      // * Copy or tint the logo for web
      if (useColor || !needsTint(avatarColor)) {
        if (needsInvert) {
          // * Invert white to black while preserving transparency
          const image = sharp(sourcePath)
          const metadata = await image.metadata()

          // * Extract alpha channel to preserve transparency
          const alpha = await image.extractChannel(3).toBuffer()

          // * Create black image with same dimensions
          const black = sharp({
            create: {
              width: metadata.width!,
              height: metadata.height!,
              channels: 3,
              background: '#000',
            },
          })

          // * Apply original alpha channel to black image
          await black.joinChannel(alpha).png().toFile(webDestPath)
          console.log(`  🔄 Inverted: ${slug}`)
        } else {
          await copyFile(sourcePath, webDestPath)
        }
      } else {
        // * For white logos, extract alpha channel and apply color
        const image = sharp(sourcePath)
        const metadata = await image.metadata()
        const alpha = await image.extractChannel(3).toBuffer()

        // * Create solid color image with same dimensions
        const colored = sharp({
          create: {
            width: metadata.width!,
            height: metadata.height!,
            channels: 3,
            background: avatarColor,
          },
        })

        // * Apply alpha channel to colored image
        await colored.joinChannel(alpha).png().toFile(webDestPath)

        console.log(`  🎨 Tinted: ${slug} (${avatarColor})`)
        tintedCount++
      }

      // * Store simplified metadata
      styles[slug] = {
        slug,
        title,
        background,
        scale: parseFloat(avatarIconScale || '0.75'),
      }

      processedCount++
    } catch (err) {
      skippedCount++
      console.warn(`  ⚠️  Skipped ${slug}:`, err instanceof Error ? err.message : err)
    }
  }

  // * Process other icons and merge with lobehub styles
  const otherStyles = await processOtherIcons(new Set(Object.keys(styles)))
  const allStylesSoFar = { ...styles, ...otherStyles }

  // * Process OpenRouter icons and merge with all styles
  const openRouterStyles = await processOpenRouterIcons(new Set(Object.keys(allStylesSoFar)))
  const allStyles = { ...allStylesSoFar, ...openRouterStyles }

  // * Build and save unified manifest
  const manifest = {
    logos: Object.fromEntries(Object.entries(allStyles).sort(([a], [b]) => a.localeCompare(b))),
    count: Object.keys(allStyles).length,
    generated: new Date().toISOString(),
  }

  await writeFile(MANIFEST_FILE, JSON.stringify(manifest, null, 2))

  console.log(`\n✅ Processing complete:`)
  console.log(`   - Processed: ${processedCount} lobehub logos`)
  console.log(`   - Tinted: ${tintedCount} logos`)
  console.log(`   - Skipped: ${skippedCount} logos`)
  console.log(`   - Other icons: ${Object.keys(otherStyles).length}`)
  console.log(`   - OpenRouter icons: ${Object.keys(openRouterStyles).length}`)
  console.log(`   - Total: ${manifest.count} logos`)
  console.log(`   📄 Manifest saved to: ${MANIFEST_FILE}`)
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`🎨 Logo Processing Script

Usage: bun scripts/process-logos.ts

Processes all logos:
- Processes logos from @lobehub/icons (extracts metadata, tints, inverts)
- Processes other icons from public/logos/sources/other
- Fetches and processes icons from OpenRouter API (fallback for missing providers)
- Generates unified manifest with all logos

Examples:
  bun scripts/process-logos.ts
  bun run logos`)
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    showHelp()
    return
  }

  console.log('🚀 Processing logos...\n')
  await processLogos()
  console.log('\n🎉 Done!')
}

if (import.meta.main) {
  main().catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
}
