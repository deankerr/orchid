'use client'

import type { Doc } from '@/convex/_generated/dataModel'

import { Card } from '@/components/ui/card'

import { EndpointDataTable } from './endpoint-data-table'

interface EndpointsComparisonProps {
  model: Doc<'or_models'>
  endpoints: Doc<'or_endpoints'>[]
}

export function EndpointsComparison({ model, endpoints }: EndpointsComparisonProps) {
  return (
    <Card className="rounded-sm py-2">
      <EndpointDataTable model={model} endpoints={endpoints} />
    </Card>
  )
}
