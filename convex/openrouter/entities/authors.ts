import z4 from 'zod/v4'
import { v } from 'convex/values'
import { internalMutation, type ActionCtx, type MutationCtx } from '../../_generated/server'
import { internal } from '../../_generated/api'
import { orFetch } from '../client'
import { AuthorViewsFn, AuthorViews, type AuthorView } from '../../author_views/table'
import { AuthorStrictSchema, AuthorTransformSchema } from '../../author_views/schemas'
import { ModelTokenStatsFn, ModelTokenStats } from '../../model_token_stats/table'
import { ModelTokenStatsStrictSchema, ModelTokenStatsTransformSchema } from '../../model_token_stats/schemas'
import { validateRecord } from '../validation'
import type { EntitySyncData, SyncConfig, MergeResult } from '../types'
import { storeJSON } from '../../files'

// Batch size for large arrays to avoid Convex limits
const MODEL_TOKEN_STATS_BATCH_SIZE = 5000

/**
 * Sync authors and model token stats for given author slugs
 */
export async function syncAuthors(
  ctx: ActionCtx,
  config: SyncConfig,
  authorSlugs: string[],
): Promise<{
  authors: EntitySyncData<AuthorView>
  modelTokenStats: EntitySyncData<ModelTokenStats>
}> {
  const allAuthors: AuthorView[] = []
  const allModelTokenStats: ModelTokenStats[] = []
  const allValidationIssues: any[] = []
  const allMergeResults: MergeResult[] = []

  console.log(`Processing ${authorSlugs.length} authors...`)

  for (const authorSlug of authorSlugs) {
    try {
      const authorData = await syncAuthor(ctx, config, authorSlug)
      allAuthors.push(authorData.author)
      allModelTokenStats.push(...authorData.modelTokenStats)
      allValidationIssues.push(...authorData.validationIssues)
    } catch (error) {
      allMergeResults.push({
        identifier: authorSlug,
        action: 'error',
        error: error instanceof Error ? error.message : 'Unknown author processing error',
      })
    }
  }

  try {
    // Merge authors
    const authorResults = await ctx.runMutation(internal.openrouter.entities.authors.mergeAuthors, {
      authors: allAuthors,
    })

    // Merge model token stats in batches to avoid Convex array limits
    const modelTokenStatsResults: MergeResult[] = []
    console.log(`Batching ${allModelTokenStats.length} model token stats...`)

    for (let i = 0; i < allModelTokenStats.length; i += MODEL_TOKEN_STATS_BATCH_SIZE) {
      const batch = allModelTokenStats.slice(i, i + MODEL_TOKEN_STATS_BATCH_SIZE)
      console.log(
        `Processing model token stats batch ${Math.floor(i / MODEL_TOKEN_STATS_BATCH_SIZE) + 1} (${batch.length} items)`,
      )

      const batchResults = await ctx.runMutation(internal.openrouter.entities.authors.mergeModelTokenStats, {
        modelTokenStats: batch,
      })
      modelTokenStatsResults.push(...batchResults)
    }

    return {
      authors: {
        items: allAuthors,
        validationIssues: allValidationIssues,
        mergeResults: authorResults,
      },
      modelTokenStats: {
        items: allModelTokenStats,
        validationIssues: [],
        mergeResults: modelTokenStatsResults,
      },
    }
  } catch (error) {
    return {
      authors: {
        items: [],
        validationIssues: allValidationIssues,
        mergeResults: allMergeResults,
        fetchError: error instanceof Error ? error.message : 'Unknown error during authors merge',
      },
      modelTokenStats: {
        items: [],
        validationIssues: [],
        mergeResults: [],
      },
    }
  }
}

// Helper function
async function syncAuthor(
  ctx: ActionCtx,
  config: SyncConfig,
  authorSlug: string,
): Promise<{ author: AuthorView; modelTokenStats: ModelTokenStats[]; validationIssues: any[] }> {
  try {
    const response = await orFetch('/api/frontend/model-author', {
      params: { authorSlug, shouldIncludeStats: true, shouldIncludeVariants: false },
      schema: z4.object({ data: z4.unknown() }),
    })

    // Store raw response
    const snapshotKey = `openrouter-author-${authorSlug}-snapshot-${config.snapshotStartTime}`
    await storeJSON(ctx, {
      key: snapshotKey,
      epoch: config.epoch,
      compress: config.compress,
      data: response,
    })

    const { item: author, issues: authorIssues } = validateRecord(
      response.data,
      AuthorTransformSchema,
      AuthorStrictSchema,
    )

    const { item: modelTokenStats, issues: tokenStatsIssues } = validateRecord(
      response.data,
      ModelTokenStatsTransformSchema,
      ModelTokenStatsStrictSchema,
    )

    return {
      author: { ...author, epoch: config.epoch },
      modelTokenStats,
      validationIssues: [...authorIssues, ...tokenStatsIssues],
    }
  } catch (error) {
    return {
      author: {} as AuthorView, // This will cause merge to fail appropriately
      modelTokenStats: [],
      validationIssues: [
        {
          type: 'fetch_error',
          message: error instanceof Error ? error.message : 'Unknown author fetch error',
          authorSlug,
        },
      ],
    }
  }
}

/**
 * Internal mutation to merge authors
 */
export const mergeAuthors = internalMutation({
  args: {
    authors: v.array(v.object(AuthorViews.withoutSystemFields)),
  },
  handler: async (ctx: MutationCtx, { authors }) => {
    const results: MergeResult[] = []

    for (const author of authors) {
      try {
        const mergeResult = await AuthorViewsFn.merge(ctx, { author })

        results.push({
          identifier: author.slug,
          action: mergeResult.action,
          docId: mergeResult.docId,
          changes: mergeResult.changes,
        })
      } catch (error) {
        results.push({
          identifier: author.slug,
          action: 'error',
          error: error instanceof Error ? error.message : 'Unknown author merge error',
        })
      }
    }

    return results
  },
})

/**
 * Internal mutation to merge model token stats
 */
export const mergeModelTokenStats = internalMutation({
  args: {
    modelTokenStats: v.array(v.object(ModelTokenStats.withoutSystemFields)),
  },
  handler: async (ctx: MutationCtx, { modelTokenStats }) => {
    try {
      const results = await ModelTokenStatsFn.mergeTimeSeries(ctx, { modelTokenStats })
      return results.map((result) => ({
        identifier: result.action,
        action: result.action,
        docId: result.docId,
        changes: result.changes,
      }))
    } catch (error) {
      return [
        {
          identifier: 'all',
          action: 'error' as const,
          error: error instanceof Error ? error.message : 'Unknown model token stats merge error',
        },
      ]
    }
  },
})
