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
import { type useOrEndpoints } from '@/hooks/api'
import { cn, formatTokenPriceToM } from '@/lib/utils'

import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

type OrEndpointData = NonNullable<ReturnType<typeof useOrEndpoints>>[number]

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
  throughput: number | null
  latency: number | null
  input_price: number
  output_price: number
  uptime: number | null
  traffic: number | null
}

// Extract data processing logic
function processEndpoints(endpoints: OrEndpointData[]): ProcessedEndpoint[] {
  // Calculate total request count for traffic percentages
  const totalRequests = endpoints.reduce((total, ep) => {
    const requestCount = ep.metrics.length > 0 ? (ep.metrics[0]?.request_count ?? 0) : 0
    return total + requestCount
  }, 0)

  return endpoints.map((ep) => {
    const metrics = ep.metrics.length > 0 ? ep.metrics[0] : null
    const validUptimes = ep.uptime.map((u) => u.uptime).filter((u): u is number => u !== undefined)
    const avgUptime =
      validUptimes.length > 0
        ? validUptimes.reduce((sum, uptime) => sum + uptime, 0) / validUptimes.length
        : null

    const requestCount = metrics?.request_count ?? 0
    const trafficPercentage = totalRequests > 0 ? (requestCount / totalRequests) * 100 : null

    return {
      id: ep._id,
      provider: ep.provider_name,
      throughput: metrics?.p50_throughput ?? null,
      latency: metrics?.p50_latency ?? null,
      input_price: ep.pricing.input ?? 0,
      output_price: ep.pricing.output ?? 0,
      uptime: avgUptime,
      traffic: trafficPercentage,
    }
  })
}

// Extract sorting logic
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

// Extract sort button component
function SortButton({
  sortKey: key,
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
  const sortIndicator =
    currentSortKey === key ? (
      sortDirection === 'asc' ? (
        <ChevronUp className="h-3 w-3" />
      ) : (
        <ChevronDown className="h-3 w-3" />
      )
    ) : (
      <div className="h-3 w-3" />
    )

  return (
    <button
      onClick={() => onSort(key)}
      className={cn(
        'flex h-full w-full items-center gap-1 py-1 text-xs font-medium text-muted-foreground',
        className,
      )}
    >
      <span>{children}</span>
      {sortIndicator}
    </button>
  )
}

export function EndpointSummary({
  model,
  endpoints,
}: {
  model: OrModel
  endpoints: OrEndpointData[]
}) {
  const [sortKey, setSortKey] = useState<SortKey>('throughput')
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

  return (
    <Card className="rounded font-mono">
      <CardHeader>
        <CardTitle>Endpoints ({endpoints.length})</CardTitle>
        <CardDescription>
          <Badge variant="secondary">{model.slug}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Data Table */}
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortButton
                  sortKey="provider"
                  currentSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                >
                  provider
                </SortButton>
              </TableHead>
              <TableHead>
                <SortButton
                  sortKey="throughput"
                  currentSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="justify-end"
                >
                  throughput
                </SortButton>
              </TableHead>
              <TableHead>
                <SortButton
                  sortKey="latency"
                  currentSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="justify-end"
                >
                  latency
                </SortButton>
              </TableHead>

              <TableHead>
                <SortButton
                  sortKey="uptime"
                  currentSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="justify-end"
                >
                  uptime
                </SortButton>
              </TableHead>
              <TableHead>
                <SortButton
                  sortKey="input_price"
                  currentSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="justify-end"
                >
                  input_price
                </SortButton>
              </TableHead>
              <TableHead>
                <SortButton
                  sortKey="output_price"
                  currentSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="justify-end"
                >
                  output_price
                </SortButton>
              </TableHead>
              <TableHead>
                <SortButton
                  sortKey="traffic"
                  currentSortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="justify-end"
                >
                  traffic
                </SortButton>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEndpoints.map((ep) => (
              <TableRow key={ep.id} className="border-b-transparent">
                <TableCell className="font-medium">{ep.provider}</TableCell>
                <TableCell className="text-right">
                  {ep.throughput !== null ? Math.round(ep.throughput).toLocaleString() : '—'} tok/s
                </TableCell>
                <TableCell className="text-right">
                  {ep.latency !== null ? Math.round(ep.latency).toLocaleString() : '—'} ms
                </TableCell>
                <TableCell className="text-right">
                  {ep.uptime !== null ? ep.uptime.toFixed(1) : '—'}%
                </TableCell>
                <TableCell className="text-right">{formatTokenPriceToM(ep.input_price)}</TableCell>
                <TableCell className="text-right">{formatTokenPriceToM(ep.output_price)}</TableCell>
                <TableCell className="text-right">
                  {ep.traffic !== null ? ep.traffic.toFixed(1) : '—'}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
