import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import {
  type ModelWithEndpoints,
  formatContextLength,
  getBestContextLength,
  getModelPriceDisplay,
  truncateText,
} from './utils'

export function ModelCard({ model }: { model: ModelWithEndpoints }) {
  // Get context length from the cheapest provider
  const contextLength = getBestContextLength(model)

  // Get formatted price display
  const priceDisplay = getModelPriceDisplay(model)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          <Link href={`/model/${model.modelKey}`} className="hover:underline">
            {model.displayName}
          </Link>
        </CardTitle>
        <div className="font-mono text-xs text-muted-foreground mt-1">{model.modelKey}</div>
        <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {truncateText(model.description, 100)}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex flex-wrap gap-1 mb-2">
          {model.architecture.inputModalities.map((modality) => (
            <Badge key={modality} variant="outline">
              {modality}
            </Badge>
          ))}
        </div>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Context:</span>
            <span>{formatContextLength(contextLength)}</span>
          </div>
          <div className="flex justify-between">
            <span>Providers:</span>
            <span>{model.endpoints.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Pricing:</span>
            <span>{priceDisplay}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/model/${model.modelKey}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
