import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { OUTPUT_DIR, SOURCES_OPENROUTER_DIR } from './config'
import { slugToTitle, type LogoStyle } from './utils'

/**
 * Process icons from OpenRouter API
 */
export async function processOpenRouterIcons(
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
