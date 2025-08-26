import type { AsObjectValidator, Infer } from 'convex/values'

import * as DB from '@/convex/db'

type ChangeObject = Infer<AsObjectValidator<typeof DB.OrChanges.vTable.validator>>

type HideRule = {
  entity?: 'provider' | 'model' | 'endpoint'
  path?: string[]
  values?: [string, string] // [oldValue, newValue] using type strings like 'nullish', 'false', etc.
  changeType?: 'ADD' | 'REMOVE' // For json-diff-ts change types
  changeValue?: string // Value type for ADD/REMOVE operations (e.g., 'false', 'true', 'nullish')
}

const HIDE_RULES: HideRule[] = [
  { changeType: 'ADD', changeValue: 'null' },
  { changeType: 'REMOVE', changeValue: 'null' },

  { entity: 'model', path: ['features'] },

  // Provider-specific rules
  { entity: 'provider', path: ['adapterName'] },
  { entity: 'provider', path: ['dataPolicy', '*'], changeType: 'ADD', changeValue: 'false' },
  { entity: 'provider', path: ['dataPolicy', 'paidModels'] },

  // Endpoint-specific rules
  { entity: 'endpoint', path: ['pricing'], changeType: 'ADD' },
  { entity: 'endpoint', path: ['pricing'], changeType: 'REMOVE' },
  { entity: 'endpoint', path: ['pricing', 'audio'], changeType: 'ADD' },
  { entity: 'endpoint', path: ['pricing', 'audio'], changeType: 'REMOVE' },
]

/**
 * Determines if a change should be displayed using an allow-first approach.
 * Returns false to hide noisy changes like minor schema details.
 */
export function shouldDisplayChange(change: ChangeObject): boolean {
  // Always display creates and deletes
  if (change.change_action === 'create' || change.change_action === 'delete') {
    return true
  }

  // For updates, check against hide rules
  if (change.change_action === 'update') {
    return !matchesAnyHideRule(change)
  }

  return true
}

function matchesAnyHideRule(change: ChangeObject): boolean {
  const { entity_type, change_root_key, change_body } = change

  for (const rule of HIDE_RULES) {
    if (matchesRule(change_root_key, change_body, entity_type, rule)) {
      return true
    }
  }

  return false
}

function matchesRule(
  rootKey: string,
  changeBody: any,
  entityType: string,
  rule: HideRule,
): boolean {
  // Check entity type if specified
  if (rule.entity && rule.entity !== entityType) {
    return false
  }

  // Handle nested path matching for changeType rules
  if (rule.changeType && rule.path && rule.path.length > 1) {
    return matchesNestedChangeRule(rootKey, changeBody, rule)
  }

  // Check path match if specified (for simple paths)
  if (rule.path) {
    if (!matchesPath(rootKey, rule.path)) {
      return false
    }
  }

  // Check change type if specified (for simple/top-level changes)
  if (rule.changeType) {
    if (!changeBody || typeof changeBody !== 'object' || !('type' in changeBody)) {
      return false
    }

    if (changeBody.type !== rule.changeType) {
      return false
    }

    // Check change value if specified
    if (rule.changeValue) {
      if (!('value' in changeBody)) {
        return false
      }

      if (!matchesValueType(changeBody.value, rule.changeValue)) {
        return false
      }
    }
  }

  // Check value conditions if specified
  if (rule.values) {
    if (
      !changeBody ||
      typeof changeBody !== 'object' ||
      !('oldValue' in changeBody) ||
      !('newValue' in changeBody)
    ) {
      return false
    }

    const { oldValue, newValue } = changeBody
    const [expectedOld, expectedNew] = rule.values

    if (!matchesValueType(oldValue, expectedOld) || !matchesValueType(newValue, expectedNew)) {
      return false
    }
  }

  return true
}

function matchesNestedChangeRule(rootKey: string, changeBody: any, rule: HideRule): boolean {
  if (!rule.path || !rule.changeType || rule.path.length < 2) {
    return false
  }

  // Check if root key matches first part of path
  const [expectedRootKey, ...nestedPath] = rule.path
  if (rootKey !== expectedRootKey) {
    return false
  }

  // Check if there are nested changes
  if (
    !changeBody ||
    typeof changeBody !== 'object' ||
    !('changes' in changeBody) ||
    !Array.isArray(changeBody.changes)
  ) {
    return false
  }

  // Look for matching nested change
  return changeBody.changes.some((change: any) => {
    if (!change || typeof change !== 'object' || !('type' in change) || !('key' in change)) {
      return false
    }

    // Check if change type matches
    if (change.type !== rule.changeType) {
      return false
    }

    // Check if nested path matches (currently only supports one level deep)
    const expectedNestedKey = nestedPath[0]
    if (expectedNestedKey !== '*' && change.key !== expectedNestedKey) {
      return false
    }

    // Check change value if specified
    if (rule.changeValue) {
      if (!('value' in change)) {
        return false
      }

      if (!matchesValueType(change.value, rule.changeValue)) {
        return false
      }
    }

    return true
  })
}

function matchesPath(rootKey: string, rulePath: string[]): boolean {
  const pathPattern = rulePath.join('.')
  return matchesPathPattern(rootKey, pathPattern)
}

function matchesPathPattern(rootKey: string, pattern: string): boolean {
  // Handle wildcard at the end (e.g., "dataPolicy.*")
  if (pattern.endsWith('*')) {
    const prefix = pattern.slice(0, -1)
    return rootKey.startsWith(prefix)
  }

  // Handle wildcard in the middle (e.g., "pricing.*.audio")
  if (pattern.includes('*')) {
    const regexPattern = pattern.split('*').map(escapeRegex).join('.*')
    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(rootKey)
  }

  // Exact match
  return pattern === rootKey
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function matchesValueType(value: any, expectedType: string): boolean {
  switch (expectedType) {
    case 'null':
      return value === null
    case 'undefined':
      return value === undefined
    case 'nullish':
      return value === null || value === undefined
    case 'non-nullish':
      return value !== null && value !== undefined
    case 'false':
      return value === false
    case 'true':
      return value === true
    case 'boolean':
      return typeof value === 'boolean'
    case 'string':
      return typeof value === 'string'
    case 'number':
      return typeof value === 'number'
    case 'object':
      return typeof value === 'object' && value !== null
    case 'array':
      return Array.isArray(value)
    default:
      return false
  }
}
