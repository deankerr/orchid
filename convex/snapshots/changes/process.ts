import { diff } from 'json-diff-ts'

import { type ActionCtx } from '../../_generated/server'
import type { ChangesTableFields } from '../../lib/changesTable'
import type { CrawlArchiveBundle } from '../crawl'
import { entityConfigs } from './config'
import { persistChanges } from './persist'

export async function processEntityChanges(
  ctx: ActionCtx,
  args: {
    entityType: keyof typeof entityConfigs
    currentBundle: CrawlArchiveBundle
    previousBundle: CrawlArchiveBundle
  },
) {
  const entityType = args.entityType

  const currentMap = entityConfigs[entityType].buildMapFromBundle(args.currentBundle)
  if (currentMap.size === 0) {
    console.log(`[changes:${String(entityType)}] no entities found in current bundle`, {
      currentBundle: args.currentBundle.crawl_id,
    })
    return
  }

  const previousMap = entityConfigs[entityType].buildMapFromBundle(args.previousBundle)
  if (previousMap.size === 0) {
    console.log(`[changes:${String(entityType)}] no entities found in previous bundle`, {
      previousBundle: args.previousBundle.crawl_id,
    })
    return
  }

  const currentCrawlId = args.currentBundle.crawl_id
  const previousCrawlId = args.previousBundle.crawl_id

  const config = entityConfigs[entityType]
  const allIds = new Set([...currentMap.keys(), ...previousMap.keys()])
  const changes: ChangesTableFields[] = []

  for (const id of allIds) {
    const currentEntity = currentMap.get(id)
    const previousEntity = previousMap.get(id)

    if (!previousEntity) {
      changes.push({
        entity_id: config.extractId(currentEntity),
        entity_name: config.extractName(currentEntity),
        event_type: 'add' as const,
        crawl_id: currentCrawlId,
        from_crawl_id: previousCrawlId,
      })
      continue
    }

    if (!currentEntity) {
      changes.push({
        entity_id: config.extractId(previousEntity),
        entity_name: config.extractName(previousEntity),
        event_type: 'remove' as const,
        crawl_id: currentCrawlId,
        from_crawl_id: previousCrawlId,
      })
      continue
    }

    const entityDiff = diff(previousEntity, currentEntity, config.diffOptions)
    for (const diffItem of entityDiff) {
      changes.push({
        entity_id: config.extractId(currentEntity),
        entity_name: config.extractName(currentEntity),
        event_type: 'update' as const,
        crawl_id: currentCrawlId,
        from_crawl_id: previousCrawlId,
        change_key: diffItem.key,
        change_raw: diffItem,
      })
    }
  }

  if (changes.length) {
    await persistChanges(ctx, {
      entityType,
      changes,
    })

    console.log(`[changes:${String(entityType)}]`, { changes: changes.length })
  }
}
