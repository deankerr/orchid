import { z } from 'zod'

// Raw change body schemas from the database
const rawChangeBodySchema = z.object({
  type: z.enum(['ADD', 'UPDATE', 'REMOVE']),
  key: z.string(),
  embeddedKey: z.string().optional(),
  value: z.unknown().optional(),
  oldValue: z.unknown().optional(),
  changes: z.array(z.any()).optional(),
})

// Discriminated union types for parsed change shapes
export type ParsedChangeShape = ValueChange | ArrayChange | RecordChange | UnknownShape

export type ValueChange = {
  type: 'value_change'
  changeType: 'ADD' | 'UPDATE' | 'REMOVE'
  key: string
  path: string[] // Path from root, e.g., [] for root, ["pricing"] for pricing.field
  oldValue: unknown
  newValue: unknown
}

export type ArrayChange = {
  type: 'array_change'
  key: string
  path: string[] // Path from root to this array
  embeddedKey: string
  changes: Array<{
    type: 'ADD' | 'REMOVE'
    value: string
  }>
}

export type RecordChange = {
  type: 'record_change'
  key: string
  path: string[] // Path from root to this record
  changes: Array<{
    key: string
    shape: ValueChange | ArrayChange | UnknownShape
  }>
}

export type UnknownShape = {
  type: 'unknown_shape'
  key?: string
  path: string[] // Path context even for unknown shapes
  raw: unknown
  reason: string
}

/**
 * Parse a change body from the database into a structured, renderable format
 * Handles the common shapes we encounter without deep recursion
 */
export function parseChangeBody(changeBody: unknown, path: string[] = []): ParsedChangeShape {
  // Handle null/undefined cases
  if (!changeBody) {
    return {
      type: 'unknown_shape',
      path,
      raw: changeBody,
      reason: 'Change body is null or undefined',
    }
  }

  // Try to parse as the expected structure
  const parseResult = rawChangeBodySchema.safeParse(changeBody)

  if (!parseResult.success) {
    return {
      type: 'unknown_shape',
      path,
      raw: changeBody,
      reason: `Invalid change body structure: ${parseResult.error.message}`,
    }
  }

  const change = parseResult.data
  const { type: changeType, key, embeddedKey, value, oldValue, changes } = change

  // Value change - no `changes` array
  if (!changes) {
    return {
      type: 'value_change',
      changeType,
      key,
      path,
      oldValue,
      newValue: value,
    }
  }

  // Array change - has `changes` and `embeddedKey`
  if (embeddedKey && Array.isArray(changes)) {
    // Parse array changes (should be ADD/REMOVE operations)
    const arrayChanges = changes
      .filter((c) => c.type === 'ADD' || c.type === 'REMOVE')
      .map((c) => ({
        type: c.type as 'ADD' | 'REMOVE',
        value: String(c.value || ''),
      }))

    return {
      type: 'array_change',
      key,
      path,
      embeddedKey,
      changes: arrayChanges,
    }
  }

  // Record change - has `changes` array without `embeddedKey`
  if (Array.isArray(changes) && !embeddedKey) {
    const recordChanges = changes.map((change) => ({
      key: change.key || 'unknown',
      shape: parseNestedChange(change, [...path, key]),
    }))

    return {
      type: 'record_change',
      key,
      path,
      changes: recordChanges,
    }
  }

  // Fallback for unknown structures
  return {
    type: 'unknown_shape',
    key,
    path,
    raw: changeBody,
    reason: '?',
  }
}

/**
 * Parse a nested change within a record change
 * Only handles one level of nesting to avoid complexity
 */
function parseNestedChange(
  change: any,
  path: string[] = [],
): ValueChange | ArrayChange | UnknownShape {
  if (!change || typeof change !== 'object') {
    return {
      type: 'unknown_shape',
      path,
      raw: change,
      reason: 'Nested change is not an object',
    }
  }

  const { type: changeType, key, embeddedKey, value, oldValue, changes } = change

  // Nested value change
  if (!changes) {
    return {
      type: 'value_change',
      changeType: changeType || 'UPDATE',
      key: key || 'unknown',
      path,
      oldValue,
      newValue: value,
    }
  }

  // Nested array change
  if (embeddedKey && Array.isArray(changes)) {
    const arrayChanges = changes
      .filter((c) => c.type === 'ADD' || c.type === 'REMOVE')
      .map((c) => ({
        type: c.type as 'ADD' | 'REMOVE',
        value: String(c.value || ''),
      }))

    return {
      type: 'array_change',
      key: key || 'unknown',
      path,
      embeddedKey,
      changes: arrayChanges,
    }
  }

  // TODO: Handle deeper nesting if needed (currently not supported)
  if (Array.isArray(changes)) {
    return {
      type: 'unknown_shape',
      key,
      path,
      raw: change,
      reason: 'Deeply nested record changes not yet supported',
    }
  }

  return {
    type: 'unknown_shape',
    key,
    path,
    raw: change,
    reason: 'Nested change structure not recognized',
  }
}
