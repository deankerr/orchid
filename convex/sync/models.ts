import { v, type Infer } from 'convex/values'
import { z } from 'zod'
import { internal } from '../_generated/api'
import { internalAction } from '../_generated/server'
import { openrouter } from '../openrouter/client'
import type { vModelList } from '../snapshots'

export const models = internalAction({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, { epoch }) => {
    const result = await openrouter.frontend.models()
    if (!result.success) {
      await ctx.runMutation(internal.snapshots.insertSnapshot, {
        resourceType: 'models',
        epoch,
        data: result,
      })
      return
    }

    const ModelSchema = z
      .object({
        author: z.string(),
        slug: z.string(),
        permaslug: z.string(),
        endpoint: z
          .object({
            id: z.string(),
            model_variant_slug: z.string(),
            variant: z.string(),
          })
          .nullable(),
      })
      .passthrough()

    const modelList: Infer<typeof vModelList> = []
    for (const data of result.data) {
      const model = ModelSchema.safeParse(data)
      if (!model.success) {
        console.error('Failed to parse model', data, model.error.flatten())
        continue
      }

      const { author, slug, permaslug, endpoint } = model.data

      const modelId = endpoint?.model_variant_slug ?? slug

      await ctx.runMutation(internal.snapshots.insertSnapshot, {
        resourceType: 'model',
        resourceId: modelId,
        epoch,
        data: { success: true, data: model.data },
      })

      modelList.push({
        modelId,
        author,
        slug,
        permaslug,
        variant: endpoint?.variant,
        topEndpointId: endpoint?.id,
      })
    }

    await ctx.runMutation(internal.snapshots.insertSnapshot, {
      resourceType: 'model-list',
      epoch,
      data: { success: true, data: modelList },
    })

    await ctx.scheduler.runAfter(0, internal.sync.endpoints.endpoints, { epoch })
    await ctx.scheduler.runAfter(0, internal.sync.recentUptimes.recentUptimes, { epoch })
    await ctx.scheduler.runAfter(0, internal.sync.apps.apps, { epoch })
    await ctx.scheduler.runAfter(0, internal.sync.modelAuthors.modelAuthors, { epoch })

    // Track completion
    await ctx.runMutation(internal.snapshots.insertSyncStatus, {
      action: 'models',
      epoch,
      event: 'completed',
      metadata: { itemCount: modelList.length },
    })
  },
})
