#!/usr/bin/env bun
import { readdir, rename, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const ICONS_DIR = 'public/icons'
const MANIFEST_FILE = 'convex/snapshots/icon-manifest.json'

async function processIcons() {
  const files = await readdir(ICONS_DIR)
  const pngFiles = files.filter((file) => file.endsWith('.png'))

  const processed = new Set<string>()

  for (const file of pngFiles) {
    if (processed.has(file)) continue

    if (file.endsWith('-color.png')) {
      const baseName = file.replace('-color.png', '')
      const monoFile = `${baseName}.png`

      if (pngFiles.includes(monoFile)) {
        const colorPath = join(ICONS_DIR, file)
        const monoPath = join(ICONS_DIR, monoFile)
        const finalPath = join(ICONS_DIR, monoFile)

        console.log(`Processing: ${baseName}`)
        console.log(`  Removing mono variant: ${monoFile}`)
        await unlink(monoPath)

        console.log(`  Renaming color variant: ${file} -> ${monoFile}`)
        await rename(colorPath, finalPath)

        processed.add(file)
        processed.add(monoFile)
      }
    }
  }

  // Generate manifest after processing
  const finalFiles = await readdir(ICONS_DIR)
  const iconNames = finalFiles
    .filter((file) => file.endsWith('.png'))
    .map((file) => file.replace('.png', ''))
    .sort()

  const manifest = {
    icons: iconNames,
    count: iconNames.length,
    generated: new Date().toISOString(),
  }

  console.log(`\nGenerating manifest with ${iconNames.length} icons...`)
  await writeFile(MANIFEST_FILE, JSON.stringify(manifest, null, 2))
  console.log(`Manifest saved to: ${MANIFEST_FILE}`)

  console.log('Icon processing complete!')
}

processIcons().catch(console.error)
