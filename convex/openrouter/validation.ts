import z4 from 'zod/v4'

export type SyncValidationIssue = {
  index: number
  error: z4.ZodError
  ref?: unknown
}

export type SyncIssues = {
  transform: SyncValidationIssue[]
  strict: SyncValidationIssue[]
}

/**
 * Initialise an empty {@link SyncIssues} object.
 */
export const initIssues = (): SyncIssues => ({ transform: [], strict: [] })

/**
 * Validate an array of raw records with a transform & strict schema pair.
 *
 * @param data           Raw records returned from the OpenRouter API
 * @param transformSchema Schema used to coerce & prune data into the desired shape
 * @param strictSchema   Schema used to *strictly* validate we understand the full structure
 * @param map            Optional mapper applied to successfully parsed transform results
 *
 * @returns              Parsed items together with any validation issues encountered
 */
export function validateArray<TParsed, TMapped = TParsed>(
  data: unknown[],
  transformSchema: z4.ZodType<TParsed>,
  strictSchema: z4.ZodTypeAny,
  map: (parsed: TParsed, index: number) => TMapped = (x) => x as unknown as TMapped,
) {
  const items: TMapped[] = []
  const issues: SyncIssues = initIssues()

  data.forEach((raw, index) => {
    // --------------------------------------------------
    // 1. Transform schema – relaxed, allows extra fields
    // --------------------------------------------------
    const t = transformSchema.safeParse(raw)
    if (t.success) items.push(map(t.data, index))
    else issues.transform.push({ index, error: t.error, ref: (raw as any)?.permaslug })

    // --------------------------------------------------
    // 2. Strict schema – full structure must match
    // --------------------------------------------------
    const s = strictSchema.safeParse(raw)
    if (!s.success) issues.strict.push({ index, error: s.error, ref: (raw as any)?.permaslug })
  })

  return { items, issues }
}

/**
 * Validate a single record with transform & strict schemas.
 * Handy for endpoints that return an object rather than an array.
 */
export function validateRecord<TParsed, TMapped = TParsed>(
  raw: unknown,
  transformSchema: z4.ZodType<TParsed>,
  strictSchema: z4.ZodTypeAny,
  map: (parsed: TParsed) => TMapped = (x) => x as unknown as TMapped,
) {
  const { items, issues } = validateArray([raw], transformSchema, strictSchema, (d) => map(d))
  return { item: items[0], issues }
}

/**
 * Utility for pretty printing validation issues.
 * Keeps the noisy Zod errors readable in logs and caps the output.
 */
export const logIssues = (label: string, issues: SyncIssues, limit = 5) => {
  if (issues.transform.length)
    console.log(
      label,
      'transform',
      issues.transform.length,
      issues.transform
        .map((i) => ({ index: i.index, ref: i.ref, msg: z4.prettifyError(i.error) }))
        .slice(0, limit),
    )

  if (issues.strict.length)
    console.log(
      label,
      'strict',
      issues.strict.length,
      issues.strict
        .map((i) => ({ index: i.index, ref: i.ref, msg: z4.prettifyError(i.error) }))
        .slice(0, limit),
    )
}
