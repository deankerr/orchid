'use client'

import { ModelEndpointsFilterWithData } from '@/components/model-endpoints-filter'

export function ModelListPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">AI Models</h1>
        <p className="text-muted-foreground">
          Discover and compare AI models available through OpenRouter
        </p>
      </div>

      <ModelEndpointsFilterWithData />
    </div>
  )
}
