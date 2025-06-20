import z4 from 'zod/v4'
import type { ValidationIssue } from './types'

/**
 * Validate an array of raw records with transform & strict schema pair
 * Returns successfully parsed items and validation issues
 */
export function validateArray<TParsed>(
  data: unknown[],
  transformSchema: z4.ZodType<TParsed>,
  strictSchema: z4.ZodTypeAny,
) {
  const items: TParsed[] = []
  const issues: ValidationIssue[] = []

  data.forEach((raw, index) => {
    // Transform schema - used to extract and shape data
    const transformResult = transformSchema.safeParse(raw)
    if (transformResult.success) {
      items.push(transformResult.data)
    } else {
      issues.push({
        index,
        type: 'transform',
        message: z4.prettifyError(transformResult.error),
      })
    }

    // Strict schema - validates our understanding of the full structure
    const strictResult = strictSchema.safeParse(raw)
    if (!strictResult.success) {
      issues.push({
        index,
        type: 'schema',
        message: z4.prettifyError(strictResult.error),
      })
    }
  })

  return { items, issues }
}

/**
 * Validate a single record with transform & strict schemas
 */
export function validateRecord<TParsed>(
  raw: unknown,
  transformSchema: z4.ZodType<TParsed>,
  strictSchema: z4.ZodTypeAny,
) {
  const { items, issues } = validateArray([raw], transformSchema, strictSchema)
  return { item: items[0], issues }
}
