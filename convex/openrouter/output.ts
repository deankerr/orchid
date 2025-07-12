import * as R from 'remeda'

import type { Doc } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'
import type { IChange } from 'json-diff-ts'

/**
 * Result of an upsert operation
 */
export interface UpsertResult {
  action: 'insert' | 'update' | 'stable'
}

/**
 * Shared upsert helper that can be used by individual entity upsert functions
 */
export async function upsertHelper<T extends { _id?: any; _creationTime?: any }>(
  ctx: MutationCtx,
  {
    tableName,
    record,
    existingRecord,
    changes,
    recordChanges,
    onStable,
    onUpdate,
  }: {
    tableName: string
    record: any
    existingRecord: T | null
    changes: IChange[]
    recordChanges?: (ctx: MutationCtx, content: any, changes: IChange[]) => Promise<void>
    onStable?: (ctx: MutationCtx, existing: T, record: any) => Promise<void>
    onUpdate?: (ctx: MutationCtx, existing: T, record: any) => Promise<void>
  },
): Promise<UpsertResult> {
  // Record changes if function provided
  if (recordChanges) {
    await recordChanges(ctx, record, changes)
  }

  // Insert
  if (!existingRecord) {
    await ctx.db.insert(tableName as any, record)
    return { action: 'insert' }
  }

  // Stable - no changes
  if (changes.length === 0) {
    if (onStable) {
      await onStable(ctx, existingRecord, record)
    } else if ('snapshot_at' in record) {
      // Default stable behavior - update snapshot_at
      await ctx.db.patch(existingRecord._id, { snapshot_at: record.snapshot_at })
    }
    return { action: 'stable' }
  }

  // Update
  if (onUpdate) {
    await onUpdate(ctx, existingRecord, record)
  } else {
    await ctx.db.replace(existingRecord._id, record)
  }
  return { action: 'update' }
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
