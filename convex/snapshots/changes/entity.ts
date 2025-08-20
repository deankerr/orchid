import { diff } from 'json-diff-ts'

import { type ActionCtx } from '../../_generated/server'
import type { ChangesTableFields } from '../../lib/changesTable'
import type { CrawlArchiveBundle } from '../crawl'
import { entityConfigs } from './config'
import { persistChanges } from './persist'

export function computeEntityChanges(
  entityType: keyof typeof entityConfigs,
  args: {
    currentMap: Map<string, any>
    previousMap: Map<string, any>
    currentCrawlId: string
    previousCrawlId: string
  },
) {
  const config = entityConfigs[entityType]
  const allIds = new Set([...args.currentMap.keys(), ...args.previousMap.keys()])
  const changes: ChangesTableFields[] = []

  for (const id of allIds) {
    const currentEntity = args.currentMap.get(id)
    const previousEntity = args.previousMap.get(id)

    if (currentEntity && !previousEntity) {
      changes.push({
        entity_id: config.extractId(currentEntity),
        entity_name: config.extractName(currentEntity),
        event_type: 'add' as const,
        crawl_id: args.currentCrawlId,
        from_crawl_id: args.previousCrawlId,
      })
      continue
    }

    if (!currentEntity && previousEntity) {
      changes.push({
        entity_id: config.extractId(previousEntity),
        entity_name: config.extractName(previousEntity),
        event_type: 'remove' as const,
        crawl_id: args.currentCrawlId,
        from_crawl_id: args.previousCrawlId,
      })
      continue
    }

    if (currentEntity && previousEntity) {
      const entityDiff = diff(previousEntity, currentEntity, config.diffOptions)
      for (const diffItem of entityDiff) {
        changes.push({
          entity_id: config.extractId(currentEntity),
          entity_name: config.extractName(currentEntity),
          event_type: 'update' as const,
          crawl_id: args.currentCrawlId,
          from_crawl_id: args.previousCrawlId,
          change_key: diffItem.key,
          change_raw: diffItem,
        })
      }
    }
  }

  return changes
}

export async function processEntityChanges(
  ctx: ActionCtx,
  entityType: keyof typeof entityConfigs,
  args: {
    currentBundle: CrawlArchiveBundle
    previousBundle: CrawlArchiveBundle
  },
) {
  const currentMap = entityConfigs[entityType].buildMapFromBundle(args.currentBundle)
  const previousMap = entityConfigs[entityType].buildMapFromBundle(args.previousBundle)

  const changes = computeEntityChanges(entityType, {
    currentMap,
    previousMap,
    currentCrawlId: args.currentBundle.crawl_id,
    previousCrawlId: args.previousBundle.crawl_id,
  })

  await persistChanges(ctx, {
    entityType,
    changes,
  })

  console.log(`[changes:${String(entityType)}]`, { changes: changes.length })
}
