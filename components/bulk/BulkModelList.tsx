'use client'

import { useBulkModels } from '@/hooks/api'
import { BulkModel } from './BulkModel'

export function BulkModelList() {
  const models = useBulkModels()

  if (!models) {
    return <div className="font-mono">Loading models...</div>
  }

  const totalEndpoints = models.reduce((sum, model) => sum + model.endpoints.length, 0)

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="font-mono text-xs pb-1 flex flex-wrap gap-4">
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
