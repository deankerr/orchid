'use client'

import { Button } from '@/components/ui/button'
import { api } from '@/convex/_generated/api'
import { useQuery } from 'convex/react'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { ModelCard } from './components/ModelCard'

const INITIAL_MODELS_LIMIT = 10
const MODELS_INCREMENT = 10

export default function MepsPage() {
  const data = useQuery(api.projections.getAllProcessedData)
  const [displayLimit, setDisplayLimit] = useState(INITIAL_MODELS_LIMIT)

  const handleShowMore = () => {
    setDisplayLimit((prev) => prev + MODELS_INCREMENT)
  }

  if (data === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const displayedData = data.slice(0, displayLimit)
  const hasMore = displayLimit < data.length

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Model Endpoints Projections</h1>
          <p className="text-muted-foreground">{data.length} models</p>
        </div>
      </div>

      <div className="grid gap-6">
        {displayedData.map((pack, index) => (
          <ModelCard key={index} pack={pack} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-6">
          <Button variant="outline" onClick={handleShowMore}>
            Show More ({data.length - displayLimit} remaining)
          </Button>
        </div>
      )}
    </div>
  )
}
