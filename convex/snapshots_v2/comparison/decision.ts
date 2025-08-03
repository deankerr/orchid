import { diff as jsonDiff } from 'json-diff-ts'

import type { Id } from '../../_generated/dataModel'

const diff = (a: unknown, b: unknown) =>
  jsonDiff(a, b, {
    keysToSkip: ['_id', '_creationTime', 'snapshot_at'],
  })

// * Decision outcome types
export type DecisionOutcome =
  | { kind: 'insert'; table: string; value: any }
  | { kind: 'update'; table: string; value: any; id: Id<any> }
  | { kind: 'stable'; table: string; id: Id<any> }

// * Metrics collector interface
export interface MetricsCollector {
  record(name: string, kind: 'insert' | 'update' | 'stable'): void
  all(): EntityMetric[]
}

// * Entity metric structure
export interface EntityMetric {
  name: string // e.g. 'or_models'
  total: number // total examined for this entity type
  insert: number
  update: number
  stable: number // no-op
}

// * Primary key extractors per table
const primaryKeyExtractors = {
  or_models: (item: any) => item.slug as string,
  or_endpoints: (item: any) => item.uuid as string,
  // Add more tables as needed
} as const

// * Generic decision function
export function decide<T extends keyof typeof primaryKeyExtractors>(
  table: T,
  next: any,
  prev: any[] | undefined,
  metrics: MetricsCollector,
): DecisionOutcome {
  const keyExtractor = primaryKeyExtractors[table]
  const nextKey = keyExtractor(next)

  // Find matching previous item by primary key
  const existing = prev?.find((item) => keyExtractor(item) === nextKey)

  if (!existing) {
    metrics.record(table, 'insert')
    return { kind: 'insert', table, value: next }
  }

  // Deep equality check - fast path for primitives, JSON.stringify fallback
  const isEqual = deepEqual(existing, next)

  if (isEqual) {
    metrics.record(table, 'stable')
    return { kind: 'stable', table, id: existing._id }
  }

  metrics.record(table, 'update')
  return { kind: 'update', table, value: next, id: existing._id }
}

// * Deep equality helper - fast === for primitives, JSON.stringify for objects
function deepEqual(a: any, b: any): boolean {
  // Fast path for primitives and null/undefined
  if (a === b) return true

  // Different types or one is null/undefined
  if (typeof a !== typeof b || a === null || b === null) return false

  // For objects, use JSON.stringify comparison (acceptable for this use case)
  if (typeof a === 'object') {
    try {
      return JSON.stringify(a) === JSON.stringify(b)
    } catch {
      return false
    }
  }

  return false
}

// * Create a new metrics collector
export function createMetricsCollector(): MetricsCollector {
  const metrics = new Map<string, EntityMetric>()

  return {
    record(name: string, kind: 'insert' | 'update' | 'stable'): void {
      if (!metrics.has(name)) {
        metrics.set(name, {
          name,
          total: 0,
          insert: 0,
          update: 0,
          stable: 0,
        })
      }

      const metric = metrics.get(name)!
      metric.total++
      metric[kind]++
    },

    all(): EntityMetric[] {
      return Array.from(metrics.values())
    },
  }
}
