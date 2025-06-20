import type {
  EntityReport,
  ProcessedIssue,
  ProcessedResult,
  SyncReport,
  Issue,
  MergeResult,
  EntitySyncData,
} from './types'

/**
 * Process issues into report format
 */
function processIssues(issues: Issue[]): ProcessedIssue[] {
  return issues.map((issue) => ({
    identifier: issue.identifier,
    type: issue.type,
    message: issue.message,
    index: issue.index,
  }))
}

/**
 * Process merge results into report format
 */
function processMergeResults(results: MergeResult[]): ProcessedResult[] {
  return results.map((result) => ({
    identifier: result.identifier,
    action: result.action,
  }))
}

/**
 * Create an entity report from sync data
 */
export function createEntityReport<T>(syncData: EntitySyncData<T>): EntityReport {
  // Process issues
  const issues = processIssues(syncData.issues)

  // Process merge results
  const results = processMergeResults(syncData.mergeResults)

  // Calculate summary
  const summary = {
    total: syncData.items.length,
    inserted: results.filter((r) => r.action === 'insert').length,
    updated: results.filter((r) => r.action === 'replace').length,
    stable: results.filter((r) => r.action === 'stable').length,
    errors: issues.filter((i) => i.type !== 'schema').length,
    warnings: issues.filter((i) => i.type === 'schema').length,
  }

  return {
    results,
    issues,
    summary,
  }
}

/**
 * Collector for building sync reports
 */
export class SnapshotReport {
  private epoch: number
  private startTime: number
  private entities: Map<string, EntityReport> = new Map()

  constructor(epoch: number, startTime: number) {
    this.epoch = epoch
    this.startTime = startTime
  }

  add<T>(entity: string, syncData: EntitySyncData<T>) {
    const report = createEntityReport(syncData)
    this.entities.set(entity, report)
  }

  create(): { report: SyncReport; summary: SyncReport['summary'] } {
    const endTime = Date.now()
    const totalSeconds = Math.round((endTime - this.startTime) / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const duration = `${minutes}m ${seconds}s`

    // Calculate summary
    let totalItems = 0
    let totalInserted = 0
    let totalUpdated = 0
    let totalStable = 0
    let totalErrors = 0
    let totalWarnings = 0

    for (const [, report] of this.entities) {
      totalItems += report.summary.total
      totalInserted += report.summary.inserted
      totalUpdated += report.summary.updated
      totalStable += report.summary.stable
      totalErrors += report.summary.errors
      totalWarnings += report.summary.warnings
    }

    const summary = {
      totalEntities: this.entities.size,
      totalItems,
      totalInserted,
      totalUpdated,
      totalStable,
      totalErrors,
      totalWarnings,
    }

    const report: SyncReport = {
      epoch: this.epoch,
      startTime: this.startTime,
      endTime,
      duration,
      summary,
      entities: Object.fromEntries(this.entities),
    }

    return { report, summary }
  }
}
