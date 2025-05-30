import type { Doc } from '@/convex/_generated/dataModel'

type ModelWithEndpoints = Doc<'models'> & {
  endpoints: Doc<'endpoints'>[]
}

export function BulkModel({ model }: { model: ModelWithEndpoints }) {
  return <div>BulkModel</div>
}
