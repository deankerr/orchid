import z4 from 'zod/v4'

export interface Issue {
  type: string
  message: string
  indices: number[]
}

function addIssue(issueMap: Map<string, Issue>, type: string, message: string, index: number) {
  const key = `${type}|${message}`
  if (issueMap.has(key)) {
    issueMap.get(key)!.indices.push(index)
  } else {
    issueMap.set(key, { type, message, indices: [index] })
  }
}

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
  const issueMap = new Map<string, Issue>()

  for (const [index, raw] of data.entries()) {
    // Transform schema - used to extract and shape data
    const transformResult = transformSchema.safeParse(raw)
    if (transformResult.success) {
      items.push(transformResult.data)
    } else {
      addIssue(issueMap, 'transform', z4.prettifyError(transformResult.error), index)
    }

    // Strict schema - validates our understanding of the full structure
    const strictResult = strictSchema.safeParse(raw)
    if (!strictResult.success) {
      addIssue(issueMap, 'schema', z4.prettifyError(strictResult.error), index)
    }
  }

  return { items, issues: Array.from(issueMap.values()) }
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
