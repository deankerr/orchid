import { v } from 'convex/values'
import z4 from 'zod/v4'

import { internal } from '../../_generated/api'
import { internalMutation, type ActionCtx, type MutationCtx } from '../../_generated/server'
import { OrAuthors, OrAuthorsFn, type OrAuthorFields } from '../../or/or_authors'
import { AuthorStrictSchema, AuthorTransformSchema } from '../../or/or_authors_validators'
import {
  OrModelTokenMetrics,
  OrModelTokenMetricsFn,
  type OrModelTokenMetricsFields,
} from '../../or/or_model_token_metrics'
import {
  ModelTokenStatsStrictSchema,
  ModelTokenStatsTransformSchema,
} from '../../or/or_model_token_metrics_validators'
import { orFetch } from '../client'
import type { EntitySyncData, Issue, SyncConfig } from '../types'
import { processBatchMutation } from '../utils'
import { validateRecord } from '../validation'

// Batch size for large arrays to avoid Convex limits
const MODEL_TOKEN_METRICS_BATCH_SIZE = 4000

/**
 * Sync authors and model token stats for given author slugs
 */
export async function syncAuthors(
  ctx: ActionCtx,
  config: SyncConfig,
  authorSlugs: string[],
): Promise<{
  authors: EntitySyncData<OrAuthorFields>
  modelTokenMetrics: EntitySyncData<OrModelTokenMetricsFields>
}> {
  const allAuthors: OrAuthorFields[] = []
  const allModelTokenMetrics: OrModelTokenMetricsFields[] = []
  const allIssues: Issue[] = []

  console.log(`Processing ${authorSlugs.length} authors...`)

  for (const authorSlug of authorSlugs) {
    const authorData = await syncAuthor(ctx, config, authorSlug)
    if (authorData.author.uuid) {
      // Only push valid authors
      allAuthors.push(authorData.author)
    }
    allModelTokenMetrics.push(...authorData.modelTokenMetrics)
    allIssues.push(...authorData.issues)
  }

  // Merge authors
  const authorResults = await ctx.runMutation(internal.openrouter.entities.authors.mergeAuthors, {
    authors: allAuthors,
  })

  // Merge model token stats in batches to avoid Convex array limits
  const modelTokenMetricsResults = await processBatchMutation({
    ctx,
    items: allModelTokenMetrics,
    batchSize: MODEL_TOKEN_METRICS_BATCH_SIZE,
    mutationRef: internal.openrouter.entities.authors.mergeModelTokenMetrics,
    mutationArgsKey: 'modelTokenMetrics',
  })

  console.log('Authors complete')
  return {
    authors: {
      items: allAuthors,
      issues: allIssues.filter((issue) => !issue.identifier.includes('token-stats')),
      mergeResults: authorResults,
    },
    modelTokenMetrics: {
      items: allModelTokenMetrics,
      issues: allIssues.filter((issue) => issue.identifier.includes('token-stats')),
      mergeResults: modelTokenMetricsResults,
    },
  }
}

// Helper function
async function syncAuthor(
  ctx: ActionCtx,
  config: SyncConfig,
  authorSlug: string,
): Promise<{
  author: OrAuthorFields
  modelTokenMetrics: OrModelTokenMetricsFields[]
  issues: Issue[]
}> {
  try {
    const response = await orFetch('/api/frontend/model-author', {
      params: { authorSlug, shouldIncludeStats: true, shouldIncludeVariants: false },
      schema: z4.object({ data: z4.unknown() }),
    })

    const { item: author, issues: authorIssues } = validateRecord(
      response.data,
      AuthorTransformSchema,
      AuthorStrictSchema,
    )

    const { item: modelTokenMetrics, issues: tokenStatsIssues } = validateRecord(
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
      author: { ...author, snapshot_at: config.snapshotAt },
      modelTokenMetrics,
      issues,
    }
  } catch (error) {
    return {
      author: {} as OrAuthorFields, // Will be skipped
      modelTokenMetrics: [],
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
    authors: v.array(v.object(OrAuthors.withoutSystemFields)),
  },
  handler: async (ctx: MutationCtx, { authors }) => {
    const results = await Promise.all(
      authors.map(async (author) => {
        const mergeResult = await OrAuthorsFn.merge(ctx, { author })
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
export const mergeModelTokenMetrics = internalMutation({
  args: {
    modelTokenMetrics: v.array(v.object(OrModelTokenMetrics.withoutSystemFields)),
  },
  handler: async (ctx: MutationCtx, { modelTokenMetrics }) => {
    const results = await OrModelTokenMetricsFn.mergeTimeSeries(ctx, { modelTokenMetrics })
    return results.map((result) => ({
      identifier: result.docId,
      action: result.action,
    }))
  },
})
