import z4, { type ZodSafeParseResult } from 'zod/v4'

// * Validation metadata - context for where validation errors occurred
export interface ValidationMetadata {
  run_id: string
  snapshot_at: number
  source: string
  params?: string
}

// * Validation issue - combines issue message with metadata
export type ValidationIssue = { message: string } & ValidationMetadata

// * Issue structure - validation problems that don't stop the process
export interface Issue {
  message: string
  run_id: string
  snapshot_at: number
  source: string
  params?: string
}

// * Validator interface for collecting and processing validation issues
export interface Validator {
  add(issue: Issue): void
  issueCount(): number
  getIssues(): Issue[]
  getErrors(): ValidationIssue[] // Legacy compatibility - TODO: remove after migration
  process<T>(results: ZodSafeParseResult<T>[], metadata: ValidationMetadata): T[]
}

// * Create a new validator instance
export function createValidator(): Validator {
  const validationIssues: ValidationIssue[] = []
  const issues: Issue[] = []

  return {
    add(issue: Issue): void {
      issues.push(issue)
      validationIssues.push({
        message: issue.message,
        run_id: issue.run_id,
        snapshot_at: issue.snapshot_at,
        source: issue.source,
        params: issue.params,
      })
    },

    issueCount(): number {
      return issues.length
    },

    getIssues(): Issue[] {
      return [...issues]
    },

    getErrors(): ValidationIssue[] {
      // Legacy compatibility - TODO: remove after migration
      return [...validationIssues]
    },

    process<T>(results: ZodSafeParseResult<T>[], metadata: ValidationMetadata): T[] {
      const validData: T[] = []

      for (const result of results) {
        if (result.success) {
          validData.push(result.data)
        } else {
          const issueMessage = z4.prettifyError(result.error)
          const issue: Issue = {
            message: issueMessage,
            ...metadata,
          }

          issues.push(issue)
          validationIssues.push({
            message: issueMessage,
            ...metadata,
          })
        }
      }

      return validData
    },
  }
}
