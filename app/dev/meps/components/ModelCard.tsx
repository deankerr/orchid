import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ExternalLink } from 'lucide-react'
import { EndpointList } from './EndpointList'

interface ModelCardProps {
  pack: {
    model: any
    endpoints: any[]
  }
}

export function ModelCard({ pack }: ModelCardProps) {
  const { model, endpoints } = pack

  // Check if model has reasoning capabilities
  const hasReasoning = !!model.reasoningConfig

  // Check if model is free (all endpoints are free)
  const isFreeModel = endpoints.length > 0 && endpoints.every((ep) => ep.isFree)

  const openRouterUrl = `https://openrouter.ai/models/${model.id}`

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-xl">{model.name}</CardTitle>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">{model.id}</Badge>
                <Badge variant="outline">{model.author}</Badge>
                {isFreeModel && <Badge variant="default">Free</Badge>}
                {model.supportsImages && <Badge>Images</Badge>}
                {model.supportsFiles && <Badge>Files</Badge>}
                {hasReasoning && <Badge>Reasoning</Badge>}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={openRouterUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
          {model.description && <p className="text-sm text-muted-foreground mt-2">{model.description}</p>}
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm"></div>

          <EndpointList endpoints={endpoints} />

          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium mb-2">Raw Model Data</summary>
            <div className="max-w-full overflow-hidden">
              <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64 max-w-full whitespace-pre-wrap break-all">
                {JSON.stringify(model, null, 2)}
              </pre>
            </div>
          </details>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
