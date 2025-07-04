import { useState } from 'react'

import { ChevronDown, ChevronUp } from 'lucide-react'

import type { OrModel } from '@/convex/types'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useOrProviders, type OrEndpointData } from '@/hooks/api'
import { cn, formatTokenPriceToM } from '@/lib/utils'

import { BrandIcon } from './brand-icon'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

type SortKey =
  | 'provider'
  | 'throughput'
  | 'latency'
  | 'input_price'
  | 'output_price'
  | 'uptime'
  | 'traffic'
type SortDirection = 'asc' | 'desc'

type ProcessedEndpoint = {
  id: string
  provider: string
  provider_slug: string
  throughput: number | null
  latency: number | null
  input_price: number
  output_price: number
  uptime: number | null
  traffic: number | null
  snapshot_at: number
}

function processEndpoints(endpoints: OrEndpointData[]): ProcessedEndpoint[] {
  // Calculate total request count for traffic percentages
  const totalRequests = endpoints.reduce((total, ep) => {
    const requestCount = ep.stats?.request_count ?? 0
    return total + requestCount
  }, 0)

  return endpoints.map((ep) => {
    const requestCount = ep.stats?.request_count ?? 0
    const trafficPercentage = totalRequests > 0 ? (requestCount / totalRequests) * 100 : null

    return {
      id: ep._id,
      provider_slug: ep.provider_slug,
      provider: ep.provider_name,
      throughput: ep.stats?.p50_throughput ?? null,
      latency: ep.stats?.p50_latency ?? null,
      input_price: ep.pricing.input ?? 0,
      output_price: ep.pricing.output ?? 0,
      uptime: ep.uptime_average ?? null,
      traffic: trafficPercentage,
      snapshot_at: ep.snapshot_at,
    }
  })
}

function sortEndpoints(
  endpoints: ProcessedEndpoint[],
  sortKey: SortKey,
  sortDirection: SortDirection,
): ProcessedEndpoint[] {
  return [...endpoints].sort((a, b) => {
    const aValue = a[sortKey]
    const bValue = b[sortKey]

    // Handle null values - always sort them to the end regardless of sort direction
    if (aValue === null && bValue === null) return 0
    if (aValue === null) return 1
    if (bValue === null) return -1

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    return sortDirection === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number)
  })
}

function SortButton({
  sortKey,
  currentSortKey,
  sortDirection,
  onSort,
  children,
  className,
}: {
  sortKey: SortKey
  currentSortKey: SortKey
  sortDirection: SortDirection
  onSort: (key: SortKey) => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={cn(
        'flex h-full w-full items-center gap-0.5 py-1 text-xs font-medium text-muted-foreground',
        className,
      )}
    >
      <span>{children}</span>
      <div className="size-3">
        {currentSortKey === sortKey && sortDirection === 'asc' ? (
          <ChevronUp className="size-3" />
        ) : currentSortKey === sortKey && sortDirection === 'desc' ? (
          <ChevronDown className="size-3" />
        ) : null}
      </div>
    </button>
  )
}

export function EndpointTable({
  endpoints,
  modelSnapshotTime,
}: {
  endpoints: OrEndpointData[]
  modelSnapshotTime: number
}) {
  const [sortKey, setSortKey] = useState<SortKey>('traffic')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const processedEndpoints = processEndpoints(endpoints)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('desc')
    }
  }

  const sortedEndpoints = sortEndpoints(processedEndpoints, sortKey, sortDirection)

  const providers = useOrProviders()

  return (
    <Table className="table-fixed text-xs">
      <TableHeader>
        <TableRow>
          <TableHead className="w-36">
            <SortButton
              sortKey="provider"
              currentSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={handleSort}
            >
              provider
            </SortButton>
          </TableHead>
          <TableHead className="w-20">
            <SortButton
              sortKey="throughput"
              currentSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="flex-row-reverse justify-start"
            >
              throughput
            </SortButton>
          </TableHead>
          <TableHead className="w-20">
            <SortButton
              sortKey="latency"
              currentSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="flex-row-reverse justify-start"
            >
              latency
            </SortButton>
          </TableHead>

          <TableHead className="w-20">
            <SortButton
              sortKey="uptime"
              currentSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="flex-row-reverse justify-start"
            >
              uptime
            </SortButton>
          </TableHead>
          <TableHead className="w-28">
            <SortButton
              sortKey="input_price"
              currentSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="flex-row-reverse justify-start"
            >
              input_price
            </SortButton>
          </TableHead>
          <TableHead className="w-28">
            <SortButton
              sortKey="output_price"
              currentSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="flex-row-reverse justify-start"
            >
              output_price
            </SortButton>
          </TableHead>
          <TableHead className="w-20">
            <SortButton
              sortKey="traffic"
              currentSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={handleSort}
              className="flex-row-reverse justify-start"
            >
              traffic
            </SortButton>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedEndpoints.map((ep) => {
          const isStale = ep.snapshot_at < modelSnapshotTime
          return (
            <TableRow key={ep.id} className={cn('border-b-transparent', isStale && 'opacity-50')}>
              <TableCell className="flex items-center gap-2.5 truncate font-medium">
                <BrandIcon
                  slug={ep.provider_slug}
                  size={16}
                  fallbackSrc={providers?.find((p) => p.slug === ep.provider_slug)?.icon.url}
                />
                {ep.provider}
              </TableCell>
              <TableCell className="text-right">
                {ep.throughput !== null ? Math.round(ep.throughput).toLocaleString() : '—'} tok/s
              </TableCell>
              <TableCell className="text-right">
                {ep.latency !== null ? Math.round(ep.latency).toLocaleString() : '—'} ms
              </TableCell>
              <TableCell className="text-right">
                {ep.uptime !== null ? ep.uptime.toFixed(1) : '— '}%
              </TableCell>
              <TableCell className="text-right">{formatTokenPriceToM(ep.input_price)}</TableCell>
              <TableCell className="text-right">{formatTokenPriceToM(ep.output_price)}</TableCell>
              <TableCell className="text-right">
                {ep.traffic !== null ? ep.traffic.toFixed(1) : '— '}%
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export function EndpointSummary({
  model,
  endpoints,
}: {
  model: OrModel
  endpoints: OrEndpointData[]
}) {
  // Group endpoints by variant
  const endpointsByVariant = Map.groupBy(endpoints, (endpoint) => endpoint.model_variant)

  // Sort variants with 'standard' first, then alphabetically
  const sortedVariants = [...endpointsByVariant.keys()].sort((a, b) => {
    if (a === 'standard') return -1
    if (b === 'standard') return 1
    return a.localeCompare(b)
  })

  return (
    <Card className="rounded font-mono">
      <CardHeader className="border-b">
        <CardTitle className="text-sm">Endpoints</CardTitle>
        <CardDescription>Compare endpoint performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {sortedVariants.map((variant) => {
          const variantEndpoints = endpointsByVariant.get(variant)!
          const title = variant === 'standard' ? model.slug : `${model.slug}:${variant}`

          return (
            <div key={variant} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{title}</div>
                <Badge variant="outline">
                  {variantEndpoints.length} endpoint{variantEndpoints.length === 1 ? '' : 's'}
                </Badge>
              </div>

              <EndpointTable endpoints={variantEndpoints} modelSnapshotTime={model.snapshot_at} />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
