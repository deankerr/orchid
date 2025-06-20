// Unified issue structure for validation and sync errors
export interface Issue {
  type: 'transform' | 'schema' | 'sync'
  identifier: string // Contextual identifier for the item (e.g., "openai/gpt-4-free", "openai/gpt-4-free:0")
  message: string
  index?: number // Optional, for validation issues from arrays
}

export interface ValidationIssue {
  index: number
  type: 'transform' | 'schema'
  message: string
}

// Raw merge result from database operations
export interface MergeResult {
  identifier: string // slug, uuid, etc.
  action: 'insert' | 'replace' | 'stable'
}

// What entity sync functions return
export interface EntitySyncData<T> {
  items: T[]
  issues: Issue[]
  mergeResults: MergeResult[]
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
  index?: number // Optional, carried through from Issue
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
