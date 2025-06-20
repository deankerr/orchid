import { v } from 'convex/values'
import * as R from 'remeda'
import z4 from 'zod/v4'

import { internal } from '../../_generated/api'
import { internalMutation, type ActionCtx, type MutationCtx } from '../../_generated/server'
import { OrModels, OrModelsFn, type OrModelFields } from '../../or/or_models'
import { ModelStrictSchema, ModelTransformSchema } from '../../or/or_models_validators'
import { storeSnapshotData } from '../archives'
import { orFetch } from '../client'
import type { EntitySyncData, Issue, SyncConfig } from '../types'
import { validateArray } from '../validation'

/**
 * Sync all models from OpenRouter
 */
export async function syncModels(
  ctx: ActionCtx,
  config: SyncConfig,
): Promise<{ models: EntitySyncData<OrModelFields> }> {
  try {
    // Fetch models data
    const response = await orFetch('/api/frontend/models', {
      schema: z4.object({ data: z4.unknown().array() }),
    })

    // Store raw response in archives
    await storeSnapshotData(ctx, {
      run_id: config.runId,
      snapshot_at: config.snapshotAt,
      type: 'models',
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
      snapshot_at: config.snapshotAt,
    }))

    // Merge models into database
    const mergeResults = await ctx.runMutation(internal.openrouter.entities.models.mergeModels, {
      models,
    })

    console.log('Models complete')
    return {
      models: {
        items: models,
        issues,
        mergeResults,
      },
    }
  } catch (error) {
    return {
      models: {
        items: [],
        issues: [
          {
            type: 'sync',
            identifier: 'models',
            message: error instanceof Error ? error.message : 'Unknown error during models fetch',
          },
        ],
        mergeResults: [],
      },
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
    models: v.array(v.object(OrModels.withoutSystemFields)),
  },
  handler: async (ctx: MutationCtx, { models }) => {
    const results = await Promise.all(
      models.map(async (model) => {
        const mergeResult = await OrModelsFn.merge(ctx, { model })
        return {
          identifier: model.slug,
          action: mergeResult.action,
        }
      }),
    )
    return results
  },
})
