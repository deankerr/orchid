'use client'

import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { BulkModel } from './BulkModel'

export function BulkModelList() {
  const models = useQuery(api.frontend.getAll)

  if (!models) {
    return <div className="p-4 font-mono">Loading models...</div>
  }

  const totalEndpoints = models.reduce((sum, model) => sum + model.endpoints.length, 0)

  return (
    <div className="p-4 pt-0 space-y-4">
      {/* Summary stats */}
      <div className="font-mono text-xs pb-1 border-b flex flex-wrap gap-4">
        <div>[ Models: {models.length} ]</div>
        <div>[ Total Endpoints: {totalEndpoints} ]</div>
      </div>

      {/* Model list */}
      <div className="space-y-6">
        {models.map((model) => (
          <BulkModel key={model._id} model={model} />
        ))}
      </div>
    </div>
  )
}
