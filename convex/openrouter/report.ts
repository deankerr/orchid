import type { EntityReport, EntitySyncData, SyncReport } from './types'

/**
 * Create an entity report from sync data
 */
export function createEntityReport<T>(syncData: EntitySyncData<T>): EntityReport {
  const issues = syncData.issues

  const summary = {
    total: syncData.items.length,
    inserted: syncData.mergeResults.filter((r) => r.action === 'insert').length,
    updated: syncData.mergeResults.filter((r) => r.action === 'replace').length,
    stable: syncData.mergeResults.filter((r) => r.action === 'stable').length,
    errors: issues.filter((i) => i.type !== 'schema').length,
    warnings: issues.filter((i) => i.type === 'schema').length,
  }

  return {
    summary,
    issues,
  }
}

/**
 * Collector for building sync reports
 */
export class SnapshotReport {
  private snapshotAt: number
  private startedAt: number
  private entities: Map<string, EntityReport> = new Map()

  constructor(snapshotAt: number, startedAt: number) {
    this.snapshotAt = snapshotAt
    this.startedAt = startedAt
  }

  add<T>(entity: string, syncData: EntitySyncData<T>) {
    const report = createEntityReport(syncData)
    this.entities.set(entity, report)
  }

  create(): { report: SyncReport; summary: SyncReport['summary'] } {
    const endTime = Date.now()
    const totalSeconds = Math.round((endTime - this.startedAt) / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const duration = `${minutes}m ${seconds}s`

    // Calculate summary
    let items = 0
    let inserted = 0
    let updated = 0
    let stable = 0
    let errors = 0
    let warnings = 0

    for (const [, report] of this.entities) {
      items += report.summary.total
      inserted += report.summary.inserted
      updated += report.summary.updated
      stable += report.summary.stable
      errors += report.summary.errors
      warnings += report.summary.warnings
    }

    const summary = {
      duration,
      entities: [...this.entities.keys()],
      items,
      inserted,
      updated,
      stable,
      errors,
      warnings,
    }

    const report: SyncReport = {
      snapshotAt: this.snapshotAt,
      startedAt: this.startedAt,
      endedAt: endTime,
      summary,
      entities: Object.fromEntries(this.entities),
    }

    return { report, summary }
  }
}
