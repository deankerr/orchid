import type {
  EntityReport,
  ProcessedIssue,
  ProcessedResult,
  SyncReport,
  ValidationIssue,
  MergeResult,
  EntitySyncData,
} from './types'

/**
 * Process validation issues into report format
 */
function processValidationIssues(issues: ValidationIssue[]): ProcessedIssue[] {
  return issues.map((issue) => ({
    identifier: `index:${issue.index}`,
    type: issue.type === 'transform' ? 'transform_error' : 'schema_warning',
    message: issue.message,
  }))
}

/**
 * Process merge results into report format
 */
function processMergeResults(results: MergeResult[]): {
  results: ProcessedResult[]
  issues: ProcessedIssue[]
} {
  const processedResults: ProcessedResult[] = []
  const processedIssues: ProcessedIssue[] = []

  for (const result of results) {
    if (result.action === 'error') {
      // Convert errors to issues
      processedIssues.push({
        identifier: result.identifier,
        type: 'merge_error',
        message: result.error || 'Unknown merge error',
      })
    } else {
      processedResults.push({
        identifier: result.identifier,
        action: result.action,
      })
    }
  }

  return { results: processedResults, issues: processedIssues }
}

/**
 * Create an entity report from sync data
 */
export function createEntityReport<T>(syncData: EntitySyncData<T>): EntityReport {
  const issues: ProcessedIssue[] = []

  // Add fetch error if present
  if (syncData.fetchError) {
    issues.push({
      identifier: 'all',
      type: 'fetch_error',
      message: syncData.fetchError,
    })
  }

  // Process validation issues
  issues.push(...processValidationIssues(syncData.validationIssues))

  // Process merge results
  const { results, issues: mergeIssues } = processMergeResults(syncData.mergeResults)
  issues.push(...mergeIssues)

  // Calculate summary
  const summary = {
    total: syncData.items.length,
    inserted: results.filter((r) => r.action === 'insert').length,
    updated: results.filter((r) => r.action === 'replace').length,
    stable: results.filter((r) => r.action === 'stable').length,
    errors: issues.filter((i) => i.type.includes('error')).length,
    warnings: issues.filter((i) => i.type.includes('warning')).length,
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
export class SyncReportCollector {
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
