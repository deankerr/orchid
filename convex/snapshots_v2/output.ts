import { internal } from '../_generated/api'
import type { Id } from '../_generated/dataModel'
import type { ActionCtx } from '../_generated/server'

// * Simplified pipeline result types
export type PipelineResult =
  | { kind: 'insert'; table: string; value: any }
  | { kind: 'update'; table: string; value: any; _id: Id<any> }
  | { kind: 'stable'; table: string; _id: Id<any> }

// * Output handler interface
export interface OutputHandler {
  name: string
  init?(ctx: ActionCtx): Promise<void> | void
  write(item: PipelineResult): Promise<void>
  finish?(): Promise<void> | void
}

// * Convex writer implementation
export class ConvexWriter implements OutputHandler {
  name = 'ConvexWriter'
  private ctx: ActionCtx

  constructor(ctx: ActionCtx) {
    this.ctx = ctx
  }

  async write(item: PipelineResult): Promise<void> {
    switch (item.kind) {
      case 'insert':
        await this.ctx.runMutation(internal.snapshots_v2.mutations.insert, {
          table: item.table,
          item: item.value,
        })
        break
      case 'update':
        await this.ctx.runMutation(internal.snapshots_v2.mutations.update, {
          table: item.table,
          _id: item._id,
          item: item.value,
        })
        break
    }
  }

  async finish(): Promise<void> {
    // No buffering needed since we're calling mutations directly
  }
}

// * Log writer implementation (for testing/debugging)
export class LogWriter implements OutputHandler {
  name = 'LogWriter'
  private counts: Record<string, { insert: number; update: number }> = {}
  private errors = 0

  async write(item: PipelineResult): Promise<void> {
    switch (item.kind) {
      case 'insert':
        this.ensureTableCounts(item.table)
        this.counts[item.table].insert++
        console.log(`🔵 ${item.table} INSERT: ${this.getItemId(item.value)}`)
        break
      case 'update':
        this.ensureTableCounts(item.table)
        this.counts[item.table].update++
        console.log(`🔄 ${item.table} UPDATE: ${this.getItemId(item.value)} (${item._id})`)
        break
    }
  }

  private ensureTableCounts(table: string) {
    if (!this.counts[table]) {
      this.counts[table] = { insert: 0, update: 0 }
    }
  }

  private getItemId(value: any): string {
    return value.slug || value.uuid || value.name || 'unknown'
  }

  async finish(): Promise<void> {
    console.log('📊 LogWriter Summary:', { ...this.counts, errors: this.errors })
  }
}
