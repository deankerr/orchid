import z4, { type ZodSafeParseResult } from 'zod/v4'

export interface ValidationMetadata {
  run_id: string
  snapshot_at: number
  source: string
  params?: string
}

export type ValidationError = { message: string } & ValidationMetadata

export function createValidator() {
  const errors: ValidationError[] = []

  return {
    process<T>(results: ZodSafeParseResult<T>[], metadata: ValidationMetadata): T[] {
      const validData: T[] = []

      for (const result of results) {
        if (result.success) {
          validData.push(result.data)
        } else {
          errors.push({
            message: z4.prettifyError(result.error),
            ...metadata,
          })
        }
      }

      return validData
    },

    getErrors(): ValidationError[] {
      return [...errors]
    },
  }
}

export type Validator = ReturnType<typeof createValidator>
