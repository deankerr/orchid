import { asyncMap } from 'convex-helpers'
import { v } from 'convex/values'
import * as R from 'remeda'

import { internal } from '../_generated/api'
import { internalMutation, type ActionCtx, type MutationCtx } from '../_generated/server'
import { type OrEndpointUptimeMetrics } from './entities/endpointUptimeMetrics'
import { type OrModelTokenMetrics } from './entities/modelTokenMetrics'
import { Entities, vEntityName, type EntityName } from './registry'

/**
 * Generic upsert that works for any registered entity helper.
 */
export interface UpsertResult {
  action: 'insert' | 'update' | 'stable'
}

export async function upsertEntity(
  ctx: MutationCtx,
  name: EntityName,
  record: any,
): Promise<UpsertResult> {
  const helper = Entities[name]
  if (!helper) throw new Error(`Unknown entity helper: ${name}`)

  const existing = await helper.fn.get(ctx, record)
  const changes = helper.fn.diff(existing ?? {}, record)

  if ('recordChanges' in helper.fn) {
    await helper.fn.recordChanges(ctx, {
      content: record,
      changes,
    })
  }

  // Insert
  if (!existing) {
    await ctx.db.insert(helper.table.name, record)
    return { action: 'insert' }
  }

  // Stable
  if (changes.length === 0) {
    return { action: 'stable' }
  }

  // Update
  await ctx.db.replace(existing._id, record)
  return { action: 'update' }
}

export const upsert = internalMutation({
  args: {
    name: vEntityName,
    items: v.array(v.any()),
  },
  handler: async (ctx, { items, ...args }) => {
    const name = args.name as EntityName

    if (name === 'endpointUptimeMetrics') {
      return await mergeEndpointUptimes(ctx, { items })
    }

    if (name === 'modelTokenMetrics') {
      return await mergeModelTokenMetrics(ctx, { items })
    }

    const mergeResults = await asyncMap(items, async (item) => {
      return await upsertEntity(ctx, name, item)
    })

    return mergeResults
  },
})

export async function output(
  ctx: ActionCtx,
  {
    entities,
    batchSize = 2000,
  }: {
    entities: { name: EntityName; items: Record<string, any>[] }[]
    batchSize?: number
  },
) {
  const results = await asyncMap(entities, async (entity) => {
    const results: UpsertResult[] = []
    const batches = R.chunk(entity.items, batchSize)

    for (const batch of batches) {
      const batchResults = await ctx.runMutation(internal.openrouter.output.upsert, {
        name: entity.name,
        items: batch,
      })

      results.push(...batchResults)
    }

    return {
      entity: entity.name,
      results: R.countBy(results, (v) => v.action),
    }
  })

  return results
}

// NOTE: temporary location for these to avoid circular dependencies

async function mergeEndpointUptimes(
  ctx: MutationCtx,
  { items }: { items: (typeof OrEndpointUptimeMetrics.$content)[] },
) {
  const uptimesByUuid = [...Map.groupBy(items, (u) => u.endpoint_uuid).values()]

  const resultsByUuid = await Promise.all(
    uptimesByUuid.map(async (uptimes) => {
      // later -> earlier
      uptimes.sort((a, b) => b.timestamp - a.timestamp)

      const results: UpsertResult[] = []
      for (const uptime of uptimes) {
        const result = await upsertEntity(ctx, 'endpointUptimeMetrics', uptime)
        results.push(result)

        if (result.action === 'stable') break // we already have this + all earlier entries
      }

      return results
    }),
  )
  return resultsByUuid.flat()
}

async function mergeModelTokenMetrics(
  ctx: MutationCtx,
  { items }: { items: (typeof OrModelTokenMetrics.$content)[] },
) {
  // stats come mixed up from the API, group them here
  const byPermaslugVariant = [
    ...Map.groupBy(items, (stat) => stat.model_permaslug + ' ' + stat.model_variant).values(),
  ]

  const resultsByPermaslugVariant = await Promise.all(
    byPermaslugVariant.map(async (modelTokenMetrics) => {
      // latest -> earliest
      modelTokenMetrics.sort((a, b) => b.timestamp - a.timestamp)

      const results: UpsertResult[] = []
      for (const stat of modelTokenMetrics) {
        const result = await upsertEntity(ctx, 'modelTokenMetrics', stat)
        results.push(result)

        if (result.action === 'stable') break // we already have this + all earlier entries
      }

      return results
    }),
  )

  return resultsByPermaslugVariant.flat()
}
