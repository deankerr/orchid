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
  snapshotAt: number
  startedAt: number
  runId: string
}

// Report structures
export interface EntityReport {
  issues: Issue[]
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
  snapshotAt: number
  startedAt: number
  endedAt: number
  summary: {
    duration: string
    entities: string[]
    items: number
    inserted: number
    updated: number
    stable: number
    errors: number
    warnings: number
  }
  entities: {
    [key: string]: EntityReport
  }
}
