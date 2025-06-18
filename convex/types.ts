import type { IChange } from 'json-diff-ts'

export type MergeResult = {
  action: 'insert' | 'replace' | 'stable'
  docId: string
  changes: IChange[]
}
