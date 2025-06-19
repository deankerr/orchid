import type { IChange } from 'json-diff-ts'

// Raw validation issue from schema parsing
export interface ValidationIssue {
  index: number
  type: 'transform' | 'strict'
  message: string
}

// Raw merge result from database operations
export interface MergeResult {
  identifier: string // slug, uuid, etc.
  action: 'insert' | 'replace' | 'stable' | 'error'
  docId?: string
  changes?: IChange[]
  error?: string // Error message if action is 'error'
}

// What entity sync functions return
export interface EntitySyncData<T> {
  items: T[]
  validationIssues: ValidationIssue[]
  mergeResults: MergeResult[]
  fetchError?: string // If the entire fetch failed
}

// Configuration for sync operations
export interface SyncConfig {
  epoch: number
  snapshotStartTime: number // Used as secondary ID for file storage
  compress: boolean // Whether to compress snapshots (default: true)
}

// Processed issue for reporting
export interface ProcessedIssue {
  identifier: string
  type: string
  message: string
}

// Processed result for reporting
export interface ProcessedResult {
  identifier: string
  action: string
}

// Report structures
export interface EntityReport {
  results: ProcessedResult[]
  issues: ProcessedIssue[]
  summary: {
    total: number
    inserted: number
    updated: number
    stable: number
    errors: number
    warnings: number
  }
}

export interface SyncReport {
  epoch: number
  startTime: number
  endTime: number
  duration: string
  summary: {
    totalEntities: number
    totalItems: number
    totalInserted: number
    totalUpdated: number
    totalStable: number
    totalErrors: number
    totalWarnings: number
  }
  entities: {
    [key: string]: EntityReport
  }
}
