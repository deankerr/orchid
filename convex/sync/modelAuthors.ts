import { v } from 'convex/values'
import { internal } from '../_generated/api'
import { internalAction } from '../_generated/server'
import { openrouter } from '../openrouter/client'
import { z } from 'zod'

export const modelAuthors = internalAction({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, { epoch }) => {
    const modelList = await ctx.runQuery(internal.snapshots.getEpochModelList, { epoch })

    const authorSlugs = new Set(modelList.map((m) => m.author))

    for (const authorSlug of authorSlugs) {
      const result = await openrouter.frontend.modelAuthor({
        authorSlug,
        shouldIncludeStats: true,
        shouldIncludeVariants: false,
      })

      if (!result.success) {
        await ctx.runMutation(internal.snapshots.insertSnapshot, {
          resourceType: 'model-author',
          resourceId: authorSlug,
          epoch,
          data: result,
        })
        continue
      }

      // * author data
      const authorsResult = z
        .object({
          author: z.record(z.string(), z.unknown()),
        })
        .safeParse(result.data)

      if (!authorsResult.success) {
        // we can't store the entire result on error because it's too big
        await ctx.runMutation(internal.snapshots.insertSnapshot, {
          resourceType: 'model-author',
          resourceId: authorSlug,
          epoch,
          data: {
            success: false,
            error: {
              type: 'validation',
              message: 'Invalid model author data',
              details: authorsResult.error.flatten(),
            },
          },
        })
        continue
      } else {
        await ctx.runMutation(internal.snapshots.insertSnapshot, {
          resourceType: 'model-author',
          resourceId: authorSlug,
          epoch,
          data: { success: true, data: authorsResult.data },
        })
      }

      // * models with stats
      const modelsWithStatsResult = z
        .object({
          modelsWithStats: z
            .object({
              slug: z.string(),
              stats: z.record(z.string(), z.unknown()).array(),
              endpoint: z
                .object({
                  model_variant_slug: z.string(),
                })
                .nullable(),
            })
            .array(),
        })
        .safeParse(result.data)

      if (!modelsWithStatsResult.success) {
        await ctx.runMutation(internal.snapshots.insertSnapshot, {
          resourceType: 'model-author',
          resourceId: authorSlug,
          epoch,
          data: {
            success: false,
            error: {
              type: 'validation',
              message: 'Invalid model author stats',
              details: modelsWithStatsResult.error.flatten(),
            },
          },
        })
        continue
      }

      for (const modelStats of modelsWithStatsResult.data.modelsWithStats) {
        const { stats, endpoint, slug } = modelStats

        await ctx.runMutation(internal.snapshots.insertSnapshot, {
          resourceType: 'model-stats',
          resourceId: endpoint?.model_variant_slug ?? slug, // this is equivalent to modelId
          epoch,
          data: { success: true, data: stats },
        })
      }
    }

    // Track completion
    await ctx.runMutation(internal.snapshots.insertSyncStatus, {
      action: 'model-authors',
      epoch,
      event: 'completed',
      metadata: {
        itemCount: authorSlugs.size,
      },
    })
  },
})
