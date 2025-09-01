import type { Doc } from '@/convex/_generated/dataModel'

export type ValueChange = {
  kind: 'value'
  path: string[]
  type: 'ADD' | 'REMOVE' | 'UPDATE'
  oldValue: unknown
  value: unknown
}

export type ArrayChangeItem = {
  type: 'ADD' | 'REMOVE' | 'UPDATE'
  value: unknown
  oldValue?: unknown
}

export type ArrayGroupChange = {
  kind: 'array'
  path: string[]
  embeddedKey: string
  changes: ArrayChangeItem[]
}

export type ParsedChange = ValueChange | ArrayGroupChange

export function parseChangeBody(change_body: Doc<'or_changes'>['change_body']) {
  // * parse change_body (recursive JSON diff structure) into a flat list
  const results: ParsedChange[] = []

  const visit = (node: any, path: string[]) => {
    if (!node || typeof node !== 'object') return

    const key: string | undefined = typeof node.key === 'string' ? node.key : undefined
    const nextPath = key ? [...path, key] : path

    const type: unknown = node.type

    // Group/update node with nested changes
    if (Array.isArray(node.changes)) {
      const isArrayGroup = typeof node.embeddedKey === 'string' && node.embeddedKey.length > 0
      if (isArrayGroup) {
        const items: ArrayChangeItem[] = node.changes
          .filter((c: any) => c && typeof c === 'object' && typeof c.type === 'string')
          .map((c: any) => ({ type: c.type, value: c.value, oldValue: c.oldValue }))
        results.push({
          kind: 'array',
          path: nextPath,
          embeddedKey: node.embeddedKey,
          changes: items,
        })
        return
      }

      for (const child of node.changes) visit(child, nextPath)
      return
    }

    if (type === 'UPDATE' || type === 'ADD' || type === 'REMOVE') {
      results.push({
        kind: 'value',
        path: nextPath,
        type,
        oldValue: node.oldValue,
        value: node.value,
      })
      return
    }
  }

  visit(change_body, [])

  return results
}

type ParsedChangeDoc =
  | { action: 'create' | 'delete'; entity: Doc<'or_changes'>['entity_type'] }
  | { action: 'update'; entity: Doc<'or_changes'>['entity_type']; changes: ParsedChange[] }

export function parseChangeDoc({
  change_action,
  change_body,
  entity_type,
}: Doc<'or_changes'>): ParsedChangeDoc {
  if (change_action === 'update') {
    return {
      action: change_action,
      entity: entity_type,
      changes: parseChangeBody(change_body),
    }
  }

  return { action: change_action, entity: entity_type }
}
