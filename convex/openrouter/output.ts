import * as R from 'remeda'

/**
 * Result of an upsert operation
 */
export interface UpsertResult {
  action: 'insert' | 'update' | 'stable'
}

/**
 * Batch processing helper
 */
export async function batch<T, R>(
  { items, batchSize = 2000 }: { items: T[]; batchSize?: number },
  callback: (itemBatch: T[]) => Promise<R[]>,
) {
  const results: R[] = []
  const batches = R.chunk(items, batchSize)

  for (const batch of batches) {
    const batchResults = await callback(batch)
    results.push(...batchResults)
  }

  return results
}
