'use client'

import { use } from 'react'

import { BulkModel } from '@/app/bulk/bulk-model'

import { useBulkModels } from '@/hooks/api'

export default function ModelPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const slug = use(params).slug.join('/')
  const models = useBulkModels()

  if (!models) {
    return (
      <div className="py-6">
        <div className="container mx-auto">
          <div className="font-mono">Loading models...</div>
        </div>
      </div>
    )
  }

  const model = models.find((m) => m.slug === slug)

  if (!model) {
    return (
      <div className="py-6">
        <div className="container mx-auto">
          <div className="font-mono">Model not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="container mx-auto">
        <BulkModel model={model} />
      </div>
    </div>
  )
}
