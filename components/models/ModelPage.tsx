'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/convex/_generated/api'
import { useQuery } from 'convex/react'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { Button } from '../ui/button'
import { formatContextLength, formatTimestamp, getBestContextLength, getFormattedPricing } from './utils'

export const ModelPage = ({ modelKey }: { modelKey: string }) => {
  const model = useQuery(api.models.getModelWithEndpoints, { modelKey })

  if (!model) {
    return (
      <div className="container mx-auto py-8">
        <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Models
        </Link>
        <Skeleton className="h-12 w-2/3 mb-4" />
        <Skeleton className="h-6 w-full mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  // Get the best context length (from cheapest provider)
  const bestContextLength = getBestContextLength(model)

  // Check if this is a free model
  const isFreeModel = model.modelKey.endsWith(':free')

  return (
    <div className="container mx-auto py-8">
      <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Models
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{model.displayName}</h1>
        <div className="font-mono text-sm bg-muted inline-block px-2 py-1 rounded mb-3">{model.modelKey}</div>
        <p className="text-muted-foreground">{model.description}</p>

        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="outline" size="sm" asChild>
            <Link
              href={`https://openrouter.ai/${model.modelKey}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <span>View on OpenRouter</span>
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          {model.huggingFaceId && (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`https://huggingface.co/${model.huggingFaceId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <span>View on HuggingFace</span>
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Model Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Features</h3>
                <div className="flex flex-wrap gap-1">
                  {model.architecture.inputModalities.map((modality) => (
                    <Badge key={`feature-${modality}`} variant="outline">
                      {modality}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-1">Specifications</h3>
                <dl className="grid grid-cols-2 gap-y-2 text-sm">
                  <dt>Context Length</dt>
                  <dd className="text-right">{formatContextLength(bestContextLength)}</dd>

                  <dt>Tokenizer</dt>
                  <dd className="text-right">{model.architecture.tokenizer}</dd>

                  {model.architecture.instructType && (
                    <>
                      <dt>Instruction Type</dt>
                      <dd className="text-right">{model.architecture.instructType}</dd>
                    </>
                  )}

                  <dt>Created</dt>
                  <dd className="text-right">{formatTimestamp(model.modelCreated)}</dd>
                </dl>
              </div>

              <div>
                <h3 className="font-medium mb-1">Supported Parameters</h3>
                <div className="flex flex-wrap gap-1">
                  {model.supportedParameters.map((param) => (
                    <Badge key={param} variant="outline">
                      {param}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {model.endpoints.map((endpoint, i) => (
                <div key={endpoint._id}>
                  {i > 0 && <Separator className="my-4" />}
                  <h3 className="font-medium">{endpoint.providerName}</h3>

                  <dl className="grid grid-cols-2 gap-y-2 text-sm mt-2">
                    <dt>Context Length</dt>
                    <dd className="text-right">{formatContextLength(endpoint.contextLength)}</dd>

                    {endpoint.maxPromptTokens && (
                      <>
                        <dt>Max Prompt</dt>
                        <dd className="text-right">{formatContextLength(endpoint.maxPromptTokens)}</dd>
                      </>
                    )}

                    {endpoint.maxCompletionTokens && (
                      <>
                        <dt>Max Completion</dt>
                        <dd className="text-right">{formatContextLength(endpoint.maxCompletionTokens)}</dd>
                      </>
                    )}

                    {endpoint.quantization && (
                      <>
                        <dt>Quantization</dt>
                        <dd className="text-right">{endpoint.quantization}</dd>
                      </>
                    )}

                    {/* Render pricing information */}
                    {getFormattedPricing(endpoint.pricing, isFreeModel).map((item) => (
                      <React.Fragment key={item.name}>
                        <dt>{item.name}</dt>
                        <dd className="text-right">{item.value}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <pre className="mt-8 font-mono text-xs bg-muted p-4 text-wrap">{JSON.stringify(model, null, 2)}</pre>
    </div>
  )
}
