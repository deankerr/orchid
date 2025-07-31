import * as DB from '@/convex/db'

import type { Id } from '../_generated/dataModel'
import type { PipelineResult } from './output'

// * Diff functions by table name
const diffFunctions = {
  or_models: DB.OrModels.diff,
  or_endpoints: DB.OrEndpoints.diff,
} as const

// * Generic diffing logic with table-based diff function lookup
export function diffItem<T extends keyof typeof diffFunctions>(
  table: T,
  newItem: any,
  existing?: { _id: Id<T> } & any,
): PipelineResult {
  if (!existing) {
    return { kind: 'insert', table, value: newItem }
  }

  const diffFn = diffFunctions[table]
  const changes = diffFn(existing, newItem)

  if (changes.length === 0) {
    return { kind: 'stable', table, _id: existing._id }
  }

  // Return new item and existing _id separately
  return { kind: 'update', table, value: newItem, _id: existing._id }
}
