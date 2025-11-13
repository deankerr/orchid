'use client'

import { useState } from 'react'

import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react'

import { api } from '@/convex/_generated/api'

import {
  PageContainer,
  PageDescription,
  PageHeader,
  PageTitle,
} from '@/components/app-layout/pages'
import { CopyToClipboardButton } from '@/components/shared/copy-to-clipboard-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { formatDateTimeUTC, formatRelativeTime } from '@/lib/formatters'

function SortableTableHeader({
  column,
  children,
  sortColumn,
  sortDirection,
  onSort,
  align = 'left',
}: {
  column: string
  children: React.ReactNode
  sortColumn: string
  sortDirection: 'asc' | 'desc'
  onSort: (column: string) => void
  align?: 'left' | 'right'
}) {
  const isActive = sortColumn === column
  const justifyClass = align === 'right' ? 'justify-end' : 'justify-start'

  return (
    <TableHead className={`font-mono`}>
      <button
        className={`inline-flex w-full items-center gap-1 hover:text-foreground ${justifyClass}`}
        onClick={() => onSort(column)}
      >
        {children}
        {isActive ? (
          sortDirection === 'asc' ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-50" />
        )}
      </button>
    </TableHead>
  )
}

export default function Page() {
  const availableDays = useCachedQuery(api.db.or.stats.getUniqueDays, {}, 'stats-days')
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Daily Model Stats</PageTitle>
        <PageDescription>Historical analytics and usage statistics for AI models</PageDescription>
      </PageHeader>

      <div className="space-y-6">
        {/* Available Days */}
        <Card>
          <CardHeader>
            <CardTitle>Available Days</CardTitle>
          </CardHeader>
          <CardContent>
            {availableDays ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {availableDays.map((day_timestamp) => (
                  <Button
                    key={day_timestamp}
                    variant={selectedDay === day_timestamp ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDay(day_timestamp)}
                    className="text-xs"
                  >
                    {formatDateTimeUTC(day_timestamp)}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Loading available days...</div>
            )}
          </CardContent>
        </Card>

        {/* Selected Day Stats */}
        {selectedDay && (
          <DayStatsView day_timestamp={selectedDay} onClose={() => setSelectedDay(null)} />
        )}
      </div>
    </PageContainer>
  )
}

function DayStatsView({ day_timestamp, onClose }: { day_timestamp: number; onClose: () => void }) {
  const [sortColumn, setSortColumn] = useState<string>('total_input_tokens')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const dayStats = useCachedQuery(
    api.db.or.stats.getStatsForDay,
    { day_timestamp },
    `stats-day-${day_timestamp}`,
  )
  const aggregatedStats = useCachedQuery(
    api.db.or.stats.getAggregatedStatsForDay,
    { day_timestamp },
    `aggregated-stats-day-${day_timestamp}`,
  )

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const sortedStats = dayStats
    ? [...dayStats].sort((a, b) => {
        const aValue: number | string = a[sortColumn as keyof typeof a] as number | string
        const bValue: number | string = b[sortColumn as keyof typeof b] as number | string

        // Handle string values (model name)
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        }

        // Handle numeric values
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
        }

        return 0
      })
    : []

  if (!dayStats || !aggregatedStats) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{formatDateTimeUTC(day_timestamp)}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading stats...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {formatDateTimeUTC(day_timestamp)}
              <Badge variant="secondary">{formatRelativeTime(day_timestamp)}</Badge>
              <CopyToClipboardButton value={day_timestamp.toString()} size="sm" />
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {aggregatedStats.modelCount} models • {aggregatedStats.totalRequests.toLocaleString()}{' '}
              total requests
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Aggregated Summary */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Total Requests</div>
            <div className="font-mono text-lg">
              {aggregatedStats.totalRequests.toLocaleString()}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Output Tokens</div>
            <div className="font-mono text-lg">
              {aggregatedStats.totalOutputTokens.toLocaleString()}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Input Tokens</div>
            <div className="font-mono text-lg">
              {aggregatedStats.totalInputTokens.toLocaleString()}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Reasoning Tokens</div>
            <div className="font-mono text-lg">
              {aggregatedStats.totalReasoningTokens.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Token Summary */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Token Usage Summary</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cached Tokens:</span>
                <span className="font-mono">
                  {aggregatedStats.totalCachedTokens.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Media Input:</span>
                <span className="font-mono">
                  {aggregatedStats.totalMediaInput.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Media Output:</span>
                <span className="font-mono">
                  {aggregatedStats.totalMediaOutput.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tool Calls:</span>
                <span className="font-mono">{aggregatedStats.totalToolCalls.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Individual Model Stats */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Per-Model Breakdown</div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHeader
                    column="version_slug"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    align="left"
                  >
                    Model
                  </SortableTableHeader>
                  <SortableTableHeader
                    column="count"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    align="right"
                  >
                    Requests
                  </SortableTableHeader>
                  <SortableTableHeader
                    column="total_input_tokens"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    align="right"
                  >
                    Input Tokens
                  </SortableTableHeader>
                  <SortableTableHeader
                    column="total_output_tokens"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    align="right"
                  >
                    Output Tokens
                  </SortableTableHeader>
                  <SortableTableHeader
                    column="total_native_tokens_reasoning"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    align="right"
                  >
                    Reasoning Tokens
                  </SortableTableHeader>
                  <SortableTableHeader
                    column="total_native_tokens_cached"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    align="right"
                  >
                    Cached Tokens
                  </SortableTableHeader>
                  <SortableTableHeader
                    column="total_tool_calls"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    align="right"
                  >
                    Tool Calls
                  </SortableTableHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStats.map((stat) => (
                  <TableRow key={stat._id}>
                    <TableCell className="font-mono">
                      <div className="flex items-center gap-2 font-medium">
                        {stat.base_slug}
                        {stat.variant !== 'standard' && (
                          <Badge variant="outline" className="text-xs">
                            {stat.variant}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {stat.count.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {stat.total_input_tokens.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {stat.total_output_tokens.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {stat.total_native_tokens_reasoning.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {stat.total_native_tokens_cached.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {stat.total_tool_calls.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Raw Data Toggle */}
        <details className="text-xs">
          <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
            View Raw Data ({dayStats.length} records)
          </summary>
          <pre className="mt-2 overflow-auto rounded bg-muted p-3 text-xs">
            {JSON.stringify(dayStats, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  )
}
