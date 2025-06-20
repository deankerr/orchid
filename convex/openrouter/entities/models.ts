import z4 from 'zod/v4'
import { v } from 'convex/values'
import { internalMutation, type ActionCtx, type MutationCtx } from '../../_generated/server'
import { internal } from '../../_generated/api'
import { orFetch } from '../client'
import { ModelsViewFn, ModelViews, type ModelView } from '../../model_views/table'
import { ModelStrictSchema, ModelTransformSchema } from '../../model_views/schemas'
import { validateArray } from '../validation'
import type { EntitySyncData, SyncConfig, MergeResult, Issue } from '../types'
import { storeJSON } from '../../files'
import * as R from 'remeda'

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

    // Convert validation issues to Issue format
    const issues: Issue[] = validationIssues.map((issue) => ({
      ...issue,
      identifier: `models:${issue.index}`,
    }))

    // Consolidate variants into models (following original logic)
    const models = consolidateVariants(modelVariants).map((model) => ({
      ...model,
      epoch: config.epoch,
    }))

    // Merge models into database
    const mergeResults = await ctx.runMutation(internal.openrouter.entities.models.mergeModels, {
      models,
    })

    return {
      items: models,
      issues,
      mergeResults,
    }
  } catch (error) {
    return {
      items: [],
      issues: [
        {
          type: 'sync',
          identifier: 'models',
          message: error instanceof Error ? error.message : 'Unknown error during models fetch',
        },
      ],
      mergeResults: [],
    }
  }
}

function consolidateVariants(models: z4.infer<typeof ModelTransformSchema>[]) {
  // models are duplicated per variant, consolidate them into the single entity with a variants list
  // use the model with shortest name as the base, e.g. "DeepSeek R1" instead of "DeepSeek R1 (free)"
  return Map.groupBy(models, (m) => m.slug)
    .values()
    .map((variants) => {
      const [first, ...rest] = variants.sort((a, b) => a.name.length - b.name.length)
      const { variant, ...base } = first
      return {
        ...base,
        variants: R.pipe([variant, ...rest.map((m) => m.variant)], R.filter(R.isDefined)),
      }
    })
    .toArray()
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
      const mergeResult = await ModelsViewFn.merge(ctx, { model })

      results.push({
        identifier: model.slug,
        action: mergeResult.action,
      })
    }

    return results
  },
})
