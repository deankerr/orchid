'use client'

import type { Doc } from '@/convex/_generated/dataModel'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { EndpointDataTable } from './endpoint-data-table'

interface EndpointsComparisonProps {
  model: Doc<'or_models'>
  endpoints: Doc<'or_endpoints'>[]
}

export function EndpointsComparison({ model, endpoints }: EndpointsComparisonProps) {
  // Group endpoints by variant
  const endpointsByVariant = Map.groupBy(endpoints, (endpoint) => endpoint.model_variant)

  // Sort variants with 'standard' first, then alphabetically
  const sortedVariants = [...endpointsByVariant.keys()].sort((a, b) => {
    if (a === 'standard') return -1
    if (b === 'standard') return 1
    return a.localeCompare(b)
  })

  // If only one variant, show table directly
  if (sortedVariants.length === 1) {
    const variant = sortedVariants[0]
    const variantEndpoints = endpointsByVariant.get(variant)!

    return (
      <Card className="rounded-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Endpoints</CardTitle>
              <CardDescription>Compare provider offerings</CardDescription>
            </div>
            {variant !== 'standard' && (
              <Badge variant="default" className="font-mono">
                :{variant}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <EndpointDataTable
            model={model}
            endpoints={variantEndpoints}
            variant={variant === 'standard' ? undefined : variant}
          />
        </CardContent>
      </Card>
    )
  }

  // Multiple variants - use tabs
  return (
    <Card className="rounded-sm">
      <CardHeader>
        <CardTitle className="text-base">Endpoints</CardTitle>
        <CardDescription>
          Compare provider offerings across {sortedVariants.length} variants
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <Tabs defaultValue={sortedVariants[0]} className="w-full">
          <TabsList className="mb-4">
            {sortedVariants.map((variant) => {
              const count = endpointsByVariant.get(variant)!.length
              return (
                <TabsTrigger key={variant} value={variant} className="gap-2 font-mono text-xs">
                  {variant === 'standard' ? model.slug : `${model.slug}:${variant}`}
                  <Badge variant="secondary" className="ml-1 text-[10px]">
                    {count}
                  </Badge>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {sortedVariants.map((variant) => {
            const variantEndpoints = endpointsByVariant.get(variant)!
            return (
              <TabsContent key={variant} value={variant} className="mt-0">
                <EndpointDataTable
                  model={model}
                  endpoints={variantEndpoints}
                  variant={variant === 'standard' ? undefined : variant}
                />
              </TabsContent>
            )
          })}
        </Tabs>
      </CardContent>
    </Card>
  )
}
