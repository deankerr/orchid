import type { DecisionOutcome } from '../comparison/decision'
import type { OutputHandler } from './convexWriter'

// * Log writer implementation - for testing/debugging
export class LogWriter implements OutputHandler {
  private counts: Record<string, { insert: number; update: number; stable: number }> = {}

  async init(): Promise<void> {
    console.log('📝 LogWriter initialized')
  }

  async write(item: DecisionOutcome): Promise<void> {
    this.ensureTableCounts(item.table)

    switch (item.kind) {
      case 'insert':
        this.counts[item.table].insert++
        console.log(`🔵 ${item.table} INSERT: ${this.getItemId(item.value)}`)
        break
      case 'update':
        this.counts[item.table].update++
        console.log(`🔄 ${item.table} UPDATE: ${this.getItemId(item.value)} (${item.id})`)
        break
      case 'stable':
        this.counts[item.table].stable++
        console.log(`⚪ ${item.table} STABLE: ${item.id}`)
        break
    }
  }

  async finish(): Promise<void> {
    console.log('📊 LogWriter Summary:')
    for (const [table, counts] of Object.entries(this.counts)) {
      const total = counts.insert + counts.update + counts.stable
      console.log(`  ${table}: ${total} total (${counts.insert} insert, ${counts.update} update, ${counts.stable} stable)`)
    }
  }

  private ensureTableCounts(table: string): void {
    if (!this.counts[table]) {
      this.counts[table] = { insert: 0, update: 0, stable: 0 }
    }
  }

  private getItemId(value: any): string {
    return value.slug || value.uuid || value.name || 'unknown'
  }
}