import z4 from 'zod/v4'
import { v } from 'convex/values'
import { internalMutation, type ActionCtx, type MutationCtx } from '../../_generated/server'
import { internal } from '../../_generated/api'
import { orFetch } from '../../openrouter/client'
import { ModelsViewFn, ModelViews, type ModelView } from '../../model_views/table'
import { ModelStrictSchema, ModelTransformSchema } from '../../model_views/schemas'
import { consolidateVariants } from '../../model_views/snapshot'
import { validateArray } from '../validation'
import type { EntitySyncData, SyncConfig, MergeResult } from '../types'
import { storeJSON } from '../../files'

/**
 * Sync all models from OpenRouter
 */
export async function syncModels(ctx: ActionCtx, config: SyncConfig): Promise<EntitySyncData<ModelView>> {
  try {
    // Fetch models data
    const response = await orFetch('/api/frontend/models', {
      schema: z4.object({ data: z4.unknown().array() }),
    })

    // Store raw response
    const snapshotKey = `openrouter-models-snapshot-${config.snapshotStartTime}`
    await storeJSON(ctx, {
      key: snapshotKey,
      epoch: config.epoch,
      compress: config.compress,
      data: response,
    })

    // Validate and transform
    const { items: modelVariants, issues: validationIssues } = validateArray(
      response.data,
      ModelTransformSchema,
      ModelStrictSchema,
    )

    // Consolidate variants into models (following original logic)
    const models = consolidateVariants(modelVariants).map((model) => ({
      ...model,
      epoch: config.epoch,
    }))

    // Merge models into database
    const mergeResults = await ctx.runMutation(internal.openrouter_beta.entities.models.mergeModels, {
      models,
    })

    return {
      items: models,
      validationIssues,
      mergeResults,
    }
  } catch (error) {
    return {
      items: [],
      validationIssues: [],
      mergeResults: [],
      fetchError: error instanceof Error ? error.message : 'Unknown error during models fetch',
    }
  }
}

/**
 * Internal mutation to merge models
 */
export const mergeModels = internalMutation({
  args: {
    models: v.array(v.object(ModelViews.withoutSystemFields)),
  },
  handler: async (ctx: MutationCtx, { models }) => {
    const results: MergeResult[] = []

    for (const model of models) {
      try {
        const mergeResult = await ModelsViewFn.merge(ctx, { model })

        results.push({
          identifier: model.slug,
          action: mergeResult.action,
          docId: mergeResult.docId,
          changes: mergeResult.changes,
        })
      } catch (error) {
        results.push({
          identifier: model.slug,
          action: 'error',
          error: error instanceof Error ? error.message : 'Unknown merge error',
        })
      }
    }

    return results
  },
})
