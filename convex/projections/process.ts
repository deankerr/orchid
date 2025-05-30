import { v } from 'convex/values'
import { diff } from 'json-diff-ts'
import { internal } from '../_generated/api'
import { internalAction, internalMutation } from '../_generated/server'
import { processEndpointsSnapshot, vEndpoint } from './endpoints'
import { processModelSnapshot, vModel } from './models'

export const startLatest = internalMutation({
  handler: async (ctx) => {
    const syncStatuses = await ctx.runQuery(internal.snapshots.getRecentSyncStatuses, {})

    const sync = syncStatuses.find(({ epoch, items }) => {
      if (
        items.some((status) => status.action === 'models' && status.status === 'completed') &&
        items.some((status) => status.action === 'endpoints' && status.status === 'completed')
      ) {
        return true
      }

      console.log('incomplete:', epoch)
      return false
    })

    if (!sync) {
      console.log('no sync found')
      return
    }

    console.log('starting', sync.epoch)
    await ctx.scheduler.runAfter(0, internal.projections.process.runEpoch, { epoch: sync.epoch })
  },
})

export const runEpoch = internalAction({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, { epoch }) => {
    const modelList = await ctx.runQuery(internal.snapshots.getEpochModelList, { epoch })
    const modelListBySlug = Map.groupBy(modelList, (m) => m.slug)

    for (const [slug, models] of modelListBySlug) {
      const modelIds = models.map((m) => m.modelId).sort()
      const baseModelId = modelIds[0]

      // * process the base model
      const modelSnapshot = await ctx.runQuery(internal.snapshots.getByResourceTypeResourceIdEpoch, {
        resourceType: 'model',
        resourceId: baseModelId,
        epoch,
      })

      if (!modelSnapshot || !modelSnapshot.success) {
        console.log('model snapshot failed', slug)
        continue
      }

      const model = processModelSnapshot(modelSnapshot)
      await ctx.runMutation(internal.projections.process.mergeModel, { model })

      for (const modelId of modelIds) {
        const endpointsSnapshot = await ctx.runQuery(internal.snapshots.getByResourceTypeResourceIdEpoch, {
          resourceType: 'endpoints',
          resourceId: modelId,
          epoch,
        })

        if (!endpointsSnapshot) {
          console.log('endpoints snapshot not found', modelId)
          continue
        }

        if (!endpointsSnapshot.success) {
          console.log('endpoints snapshot failed', modelId)
          continue
        }

        const endpoints = processEndpointsSnapshot(model, endpointsSnapshot)
        for (const { endpoint } of endpoints) {
          await ctx.runMutation(internal.projections.process.mergeEndpoint, {
            endpoint,
          })
        }
      }
    }
  },
})

export const mergeModel = internalMutation({
  args: {
    model: vModel,
  },
  handler: async (ctx, { model }) => {
    const slug = model.slug

    const existing = await ctx.db
      .query('models')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .first()
    if (existing) {
      const { _id, _creationTime, ...rest } = existing
      const results = diff(rest, model)
      console.log('replace model:', slug, results)
      return await ctx.db.replace(existing._id, model)
    } else {
      console.log('insert model:', slug)
      return await ctx.db.insert('models', model)
    }
  },
})

export const mergeEndpoint = internalMutation({
  args: {
    endpoint: vEndpoint,
  },
  handler: async (ctx, { endpoint }) => {
    const uuid = endpoint.uuid

    const existing = await ctx.db
      .query('endpoints')
      .withIndex('by_uuid', (q) => q.eq('uuid', uuid))
      .first()
    if (existing) {
      const { _id, _creationTime, ...rest } = existing
      const results = diff(rest, endpoint)
      console.log('replace endpoint:', uuid, results)
      return await ctx.db.replace(existing._id, endpoint)
    } else {
      console.log('insert endpoint:', endpoint.name)
      return await ctx.db.insert('endpoints', endpoint)
    }
  },
})
