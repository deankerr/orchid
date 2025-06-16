import type { IChange } from 'json-diff-ts'

export type MergeResult = {
  action: 'insert' | 'replace' | 'stable'
  _id: string
  diff: IChange[]
}
