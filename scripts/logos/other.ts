import { copyFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { OUTPUT_DIR, SOURCES_OTHER_DIR } from './config'
import { slugToTitle, type LogoStyle } from './utils'

/**
 * Process other icons from sources/other directory
 */
export async function processOtherIcons(
  existingSlugs: Set<string>,
): Promise<Record<string, LogoStyle>> {
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
