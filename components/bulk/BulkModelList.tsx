'use client'

import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

export function BulkModelList() {
  const models = useQuery(api.frontend.getAll)

  if (!models) {
    return <div>Loading...</div>
  }

  return <div>{models?.map((model) => <div key={model._id}>{model.name}</div>)}</div>
}
