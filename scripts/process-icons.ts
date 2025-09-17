#!/usr/bin/env bun
import { copyFile, mkdir, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import sharp from 'sharp'

const LOBEHUB_SOURCE = 'node_modules/@lobehub/icons-static-png/dark'
const ORIGINALS_DIR = 'public/icons'
const RESIZED_DIR = 'public/icons/32'
const MANIFEST_FILE = 'convex/snapshots/shared/icon-manifest.json'

/*
 * Import icons from @lobehub/icons-static-png
 * - Filters out *-brand* and *-text* files
 * - Handles color variants (prefers color over mono)
 */
async function importIcons() {
  console.log('🔄 Importing icons from @lobehub/icons-static-png...')

  const sourceFiles = await readdir(LOBEHUB_SOURCE)
  const pngFiles = sourceFiles
    .filter((file) => file.endsWith('.png'))
    .filter((file) => !file.includes('-brand'))
    .filter((file) => !file.includes('-text'))

  console.log(`Found ${pngFiles.length} qualifying source icons`)

  // Ensure originals directory exists
  await mkdir(ORIGINALS_DIR, { recursive: true })

  const processed = new Set<string>()
  let importedCount = 0
  let skippedCount = 0

  for (const file of pngFiles) {
    if (processed.has(file)) continue

    const sourcePath = join(LOBEHUB_SOURCE, file)

    if (file.endsWith('-color.png')) {
      const baseName = file.replace('-color.png', '')
      const monoFile = `${baseName}.png`

      // Check if mono variant exists
      if (pngFiles.includes(monoFile)) {
        // Use color variant, rename to mono name
        const destPath = join(ORIGINALS_DIR, monoFile)
        await copyFile(sourcePath, destPath)

        console.log(`  ✨ ${baseName}: using color variant`)
        processed.add(file)
        processed.add(monoFile)
        importedCount++
      } else {
        // No mono variant, just copy color version with original name
        const destPath = join(ORIGINALS_DIR, file)
        await copyFile(sourcePath, destPath)

        console.log(`  📋 ${file}`)
        processed.add(file)
        importedCount++
      }
    } else {
      // Check if this mono file has a color variant
      const colorFile = file.replace('.png', '-color.png')

      if (!pngFiles.includes(colorFile)) {
        // No color variant, copy mono version
        const destPath = join(ORIGINALS_DIR, file)
        await copyFile(sourcePath, destPath)

        console.log(`  📋 ${file}`)
        processed.add(file)
        importedCount++
      } else {
        // Color variant exists, skip mono (will be processed by color variant)
        console.log(`  ⏭️  ${file} (color variant preferred)`)
        processed.add(file)
        skippedCount++
      }
    }
  }

  console.log(`✅ Import complete: ${importedCount} imported, ${skippedCount} skipped`)
}

/*
 * Resize all icons in originals to 32x32px
 */
async function resizeIcons() {
  console.log('🔄 Resizing icons to 32x32px...')

  const files = await readdir(ORIGINALS_DIR)
  const pngFiles = files.filter((file) => file.endsWith('.png'))

  console.log(`Found ${pngFiles.length} icons to resize`)

  // Ensure resized directory exists
  await mkdir(RESIZED_DIR, { recursive: true })

  let resizedCount = 0

  for (const file of pngFiles) {
    const sourcePath = join(ORIGINALS_DIR, file)
    const destPath = join(RESIZED_DIR, file)

    try {
      await sharp(sourcePath)
        .resize(32, 32, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toFile(destPath)

      resizedCount++
      if (resizedCount % 50 === 0) {
        console.log(`  📐 Resized ${resizedCount}/${pngFiles.length} icons...`)
      }
    } catch (error) {
      console.warn(`  ⚠️  Failed to resize ${file}:`, error)
    }
  }

  console.log(`✅ Resize complete: ${resizedCount} icons resized`)
}

/*
 * Generate manifest of available icons
 */
async function generateManifest() {
  console.log('🔄 Generating icon manifest...')

  const files = await readdir(ORIGINALS_DIR)
  const iconNames = files
    .filter((file) => file.endsWith('.png'))
    .map((file) => file.replace('.png', ''))
    .sort()

  const resizedFiles = await readdir(RESIZED_DIR).catch(() => [])
  const resizedNames = resizedFiles
    .filter((file) => file.endsWith('.png'))
    .map((file) => file.replace('.png', ''))
    .sort()

  const manifest = {
    icons: iconNames,
    resized: resizedNames,
    count: iconNames.length,
    resizedCount: resizedNames.length,
    generated: new Date().toISOString(),
  }

  await writeFile(MANIFEST_FILE, JSON.stringify(manifest, null, 2))

  console.log(`✅ Manifest generated: ${iconNames.length} icons, ${resizedNames.length} resized`)
  console.log(`   📄 Saved to: ${MANIFEST_FILE}`)
}

/*
 * Show help message
 */
function showHelp() {
  console.log(`🔧 Icon Processing Script

Usage: bun scripts/process-icons.ts <command>

Commands:
  all       Run all steps (import → resize → manifest)
  import    Import icons from @lobehub/icons-static-png
  resize    Resize icons to 32x32px
  manifest  Generate icon manifest

Examples:
  bun scripts/process-icons.ts all
  bun scripts/process-icons.ts import resize
  bun run icons all`)
}

/*
 * Main function with CLI interface
 */
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    showHelp()
    return
  }

  // Handle 'all' command
  if (args.includes('all')) {
    console.log('🚀 Running all icon processing steps...\n')
    await importIcons()
    console.log()
    await resizeIcons()
    console.log()
    await generateManifest()
    console.log()
    console.log('🎉 All icon processing complete!')
    return
  }

  // Run specific steps
  for (const step of args) {
    switch (step) {
      case 'import':
        await importIcons()
        break
      case 'resize':
        await resizeIcons()
        break
      case 'manifest':
        await generateManifest()
        break
      default:
        console.error(`❌ Unknown command: ${step}`)
        console.log()
        showHelp()
        process.exit(1)
    }
    console.log()
  }

  console.log('✅ Selected steps complete!')
}

// Handle script execution
if (import.meta.main) {
  main().catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
}
