import * as R from 'remeda'
import type { ActionCtx } from '../_generated/server'
import type { FunctionReference } from 'convex/server'
import type { MergeResult } from './types'

interface BatchMutationOptions<T> {
  ctx: ActionCtx
  items: T[]
  batchSize: number
  mutationRef: FunctionReference<'mutation', 'internal', any, any>
  mutationArgsKey: string // e.g., 'appTokens', 'modelTokenStats', etc.
  label?: string // For logging, e.g., 'app token', 'model token stats'
}

/**
 * Process items in batches through a mutation to avoid Convex array limits
 *
 * @example
 * const results = await processBatchMutation({
 *   ctx,
 *   items: allAppTokens,
 *   batchSize: 2000,
 *   mutationRef: internal.openrouter.entities.apps.mergeAppTokens,
 *   mutationArgsKey: 'appTokens',
 *   label: 'app token'
 * })
 */
export async function processBatchMutation<T>({
  ctx,
  items,
  batchSize,
  mutationRef,
  mutationArgsKey,
  label = 'item',
}: BatchMutationOptions<T>): Promise<MergeResult[]> {
  const results: MergeResult[] = []
  const batches = R.chunk(items, batchSize)

  console.log(`Batching ${items.length} ${label}s into ${batches.length} batches...`)

  for (const [index, batch] of batches.entries()) {
    console.log(`Processing ${label} batch ${index + 1}/${batches.length} (${batch.length} items)`)

    const batchResults = await ctx.runMutation(mutationRef, {
      [mutationArgsKey]: batch,
    })

    results.push(...batchResults)
  }

  return results
}
