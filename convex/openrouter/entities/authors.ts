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
import type { EntitySyncData, SyncConfig, MergeResult, Issue } from '../types'
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
  const allIssues: Issue[] = []

  console.log(`Processing ${authorSlugs.length} authors...`)

  for (const authorSlug of authorSlugs) {
    const authorData = await syncAuthor(ctx, config, authorSlug)
    if (authorData.author.uuid) {
      // Only push valid authors
      allAuthors.push(authorData.author)
    }
    allModelTokenStats.push(...authorData.modelTokenStats)
    allIssues.push(...authorData.issues)
  }

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
      issues: allIssues.filter((issue) => !issue.identifier.includes('token-stats')),
      mergeResults: authorResults,
    },
    modelTokenStats: {
      items: allModelTokenStats,
      issues: allIssues.filter((issue) => issue.identifier.includes('token-stats')),
      mergeResults: modelTokenStatsResults,
    },
  }
}

// Helper function
async function syncAuthor(
  ctx: ActionCtx,
  config: SyncConfig,
  authorSlug: string,
): Promise<{ author: AuthorView; modelTokenStats: ModelTokenStats[]; issues: Issue[] }> {
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

    // Convert validation issues to Issue format
    const issues: Issue[] = [
      ...authorIssues.map((issue) => ({
        ...issue,
        identifier: `author-${authorSlug}:${issue.index}`,
      })),
      ...tokenStatsIssues.map((issue) => ({
        ...issue,
        identifier: `token-stats-${authorSlug}:${issue.index}`,
      })),
    ]

    return {
      author: { ...author, epoch: config.epoch },
      modelTokenStats,
      issues,
    }
  } catch (error) {
    return {
      author: {} as AuthorView, // Will be skipped
      modelTokenStats: [],
      issues: [
        {
          type: 'sync',
          identifier: `author-${authorSlug}`,
          message: error instanceof Error ? error.message : 'Unknown author fetch error',
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
    const results = await Promise.all(
      authors.map(async (author) => {
        const mergeResult = await AuthorViewsFn.merge(ctx, { author })
        return {
          identifier: author.slug,
          action: mergeResult.action,
        }
      }),
    )
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
    const results = await ModelTokenStatsFn.mergeTimeSeries(ctx, { modelTokenStats })
    return results.map((result) => ({
      identifier: result.docId,
      action: result.action,
    }))
  },
})
