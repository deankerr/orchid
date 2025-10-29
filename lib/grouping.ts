import * as R from 'remeda'

export type GroupBucket<K, T> = {
  key: K
  items: T[]
}

export function groupByMap<T, K>(items: readonly T[], keySelector: (item: T) => K): Map<K, T[]> {
  const buckets = new Map<K, T[]>()

  for (const item of items) {
    const key = keySelector(item)
    const existing = buckets.get(key)

    if (existing) {
      existing.push(item)
    } else {
      buckets.set(key, [item])
    }
  }

  return buckets
}

export function groupBy<T, K>(
  items: readonly T[],
  keySelector: (item: T) => K,
): GroupBucket<K, T>[] {
  return R.pipe(
    groupByMap(items, keySelector),
    (map) => Array.from(map.entries()),
    R.map(([key, group]) => ({ key, items: group }) satisfies GroupBucket<K, T>),
  )
}
