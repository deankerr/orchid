import { v } from 'convex/values'
import { z } from 'zod'
import { internal } from '../_generated/api'
import { internalAction } from '../_generated/server'
import { openrouter } from '../openrouter/client'

export const providers = internalAction({
  args: {
    epoch: v.number(),
  },
  handler: async (ctx, { epoch }) => {
    const result = await openrouter.frontend.allProviders()

    if (!result.success) {
      await ctx.runMutation(internal.snapshots.insertSnapshot, {
        resourceType: 'providers',
        epoch,
        data: result,
      })
      return
    }

    const providersResult = z
      .object({
        slug: z.string(),
      })
      .passthrough()
      .array()
      .safeParse(result.data)

    if (!providersResult.success) {
      await ctx.runMutation(internal.snapshots.insertSnapshot, {
        resourceType: 'providers',
        epoch,
        data: {
          success: false,
          error: {
            type: 'validation',
            message: 'Failed to parse providers',
            details: providersResult.error.flatten(),
          },
        },
      })
      return
    }

    for (const provider of providersResult.data) {
      await ctx.runMutation(internal.snapshots.insertSnapshot, {
        resourceType: 'provider',
        resourceId: provider.slug,
        epoch,
        data: { success: true, data: provider },
      })
    }

    // Track completion
    await ctx.runMutation(internal.snapshots.insertSyncStatus, {
      action: 'providers',
      epoch,
      event: 'completed',
      metadata: { itemCount: providersResult.data.length },
    })
  },
})
