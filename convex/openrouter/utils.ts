import * as R from 'remeda'
import type { ActionCtx } from '../_generated/server'
import type { FunctionReference } from 'convex/server'
import type { MergeResult, EntitySyncData } from './types'

interface BatchMutationOptions<T> {
  ctx: ActionCtx
  items: T[]
  batchSize: number
  mutationRef: FunctionReference<'mutation', 'internal', any, any>
  mutationArgsKey: string // e.g., 'appTokens', 'modelTokenStats', etc.
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
}: BatchMutationOptions<T>): Promise<MergeResult[]> {
  const results: MergeResult[] = []
  const batches = R.chunk(items, batchSize)

  console.log(`Merging ${items.length} ${mutationArgsKey} in ${batches.length} batches...`)

  for (const batch of batches) {
    const batchResults = await ctx.runMutation(mutationRef, {
      [mutationArgsKey]: batch,
    })

    results.push(...batchResults)
  }

  return results
}

/**
 * Execute multiple sync operations in parallel with automatic error handling
 * All sync functions should return objects with entity names as keys
 *
 * @example
 * const results = await runParallelSync({
 *   phase1: syncProviders(ctx, config), // returns { providers: EntitySyncData<...> }
 *   phase2: syncModels(ctx, config), // returns { models: EntitySyncData<...> }
 *   phase3: syncEndpoints(ctx, config, models), // returns { endpoints: ..., endpointStats: ..., endpointUptimes: ... }
 * })
 *
 * // Flatten and add to collector
 * for (const [entity, data] of Object.entries(flattenSyncResults(results))) {
 *   collector.add(entity, data)
 * }
 */
export async function runParallelSync<T extends Record<string, Promise<any>>>(
  operations: T,
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  const entries = Object.entries(operations)
  const keys = entries.map(([key]) => key)
  const promises = entries.map(([, promise]) => promise)

  const results = await Promise.allSettled(promises)

  const output: any = {}

  for (let i = 0; i < results.length; i++) {
    const key = keys[i]
    const result = results[i]

    if (result.status === 'fulfilled') {
      output[key] = result.value
    } else {
      // Convert rejection to error structure
      console.error(`${key} sync failed:`, result.reason)

      // Since we don't know the structure, create a generic error response
      // The sync operation key will be used as the entity name
      const errorResponse: EntitySyncData<any> = {
        items: [],
        issues: [
          {
            type: 'sync' as const,
            identifier: key,
            message: result.reason instanceof Error ? result.reason.message : String(result.reason),
          },
        ],
        mergeResults: [],
      }

      // Return error wrapped in object with operation key
      output[key] = { [key]: errorResponse }
    }
  }

  return output
}

/**
 * Flatten sync results into a single object with all entity data
 *
 * @example
 * const results = await runParallelSync({ ... })
 * const flattened = flattenSyncResults(results)
 * // flattened = { providers: EntitySyncData<...>, models: EntitySyncData<...>, endpoints: EntitySyncData<...>, ... }
 */
export function flattenSyncResults(
  results: Record<string, Record<string, EntitySyncData<any>>>,
): Record<string, EntitySyncData<any>> {
  const flattened: Record<string, EntitySyncData<any>> = {}

  for (const operationResult of Object.values(results)) {
    for (const [entity, data] of Object.entries(operationResult)) {
      flattened[entity] = data
    }
  }

  return flattened
}
