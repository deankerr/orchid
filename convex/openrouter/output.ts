import * as R from 'remeda'

export function countResults(results: { action: string }[], name: string) {
  return {
    ...R.countBy(results, (v) => v.action),
    name,
  }
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
