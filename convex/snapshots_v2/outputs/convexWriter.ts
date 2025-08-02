import { internal } from '../../_generated/api'
import type { ActionCtx } from '../../_generated/server'
import type { DecisionOutcome } from '../comparison/decision'

// * Unified output handler interface
export interface OutputHandler {
  init?(): Promise<void>
  write(item: DecisionOutcome): Promise<void>
  finish?(): Promise<void>
}

// * Convex writer implementation - buffers items and flushes in chunks
export class ConvexWriter implements OutputHandler {
  private ctx: ActionCtx
  private buffer: Map<string, DecisionOutcome[]> = new Map()
  private readonly chunkSize = 100

  constructor(ctx: ActionCtx) {
    this.ctx = ctx
  }

  async init(): Promise<void> {
    // No initialization needed
  }

  async write(item: DecisionOutcome): Promise<void> {
    // Skip stable items - they don't need to be written
    if (item.kind === 'stable') {
      return
    }

    // Buffer items by table
    if (!this.buffer.has(item.table)) {
      this.buffer.set(item.table, [])
    }
    
    const tableBuffer = this.buffer.get(item.table)!
    tableBuffer.push(item)

    // Flush if buffer is full
    if (tableBuffer.length >= this.chunkSize) {
      await this.flushTable(item.table)
    }
  }

  async finish(): Promise<void> {
    // Flush all remaining buffered items
    for (const table of this.buffer.keys()) {
      await this.flushTable(table)
    }
    this.buffer.clear()
  }

  private async flushTable(table: string): Promise<void> {
    const items = this.buffer.get(table)
    if (!items || items.length === 0) {
      return
    }

    // Process items in chunks
    for (let i = 0; i < items.length; i += this.chunkSize) {
      const chunk = items.slice(i, i + this.chunkSize)
      
      for (const item of chunk) {
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
              _id: item.id,
              item: item.value,
            })
            break
        }
      }
    }

    // Clear the buffer for this table
    this.buffer.set(table, [])
  }
}