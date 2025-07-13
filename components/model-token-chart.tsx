'use client'

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

import type { OrModelTokenMetric } from '@/convex/types'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { formatIsoDate } from '@/lib/utils'

import { Separator } from './ui/separator'

const chartConfig = {
  input_tokens: {
    label: 'input',
    color: 'var(--chart-1)',
  },
  output_tokens: {
    label: 'output',
    color: 'var(--chart-2)',
  },
  reasoning_tokens: {
    label: 'reasoning',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig

// Format numbers with K/M/B suffixes
const formatNumber = (value: number) => {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`
  return value.toString()
}

// Custom tooltip component for better control
function CustomTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: any[]
  label?: string
}) {
  if (!active || !payload?.length) {
    return null
  }

  // Format the date nicely
  const formattedDate = label ? formatIsoDate(new Date(label).getTime()) : 'Tokens'

  // Define the order we want (matching visual stack from bottom to top)
  const sortedPayload = payload.toReversed()

  // Calculate total
  const total = payload.reduce((sum, item) => sum + (item.value || 0), 0)

  return (
    <div className="rounded-lg border bg-background p-2.5 font-mono text-xs shadow-xl">
      <div className="mb-1.5 font-medium">{formattedDate}</div>
      <div className="grid gap-1.5">
        {sortedPayload.map((item) => {
          const config = chartConfig[item.dataKey as keyof typeof chartConfig]
          if (!config) return null

          return (
            <div key={item.dataKey} className="flex items-center gap-2">
              <div
                className="h-2.5 w-1 shrink-0"
                style={{ backgroundColor: item.color || config.color }}
              />
              <div className="flex flex-1 items-center justify-between gap-8">
                <span className="text-muted-foreground">{config.label}</span>
                <span className="font-medium text-foreground">{formatNumber(item.value)}</span>
              </div>
            </div>
          )
        })}

        {/* Separator and total */}
        <Separator />
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center justify-between gap-8">
            <span className="font-medium">Total</span>
            <span className="font-medium text-foreground">{formatNumber(total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ModelTokenChartProps {
  data: OrModelTokenMetric[]
  variant: string
  title?: string
}

export function ModelTokenChart({ data, variant, title }: ModelTokenChartProps) {
  // Sort data by timestamp (oldest first for proper chart display)
  const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp)

  // Get the first data point
  const first = sortedData[0]

  if (!first) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-sm">{title || 'Token Usage'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-mono text-sm text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    )
  }

  // Pad the start if needed
  let chartData = [...sortedData].map((metric) => ({
    date: new Date(metric.timestamp).toISOString().split('T')[0],
    timestamp: metric.timestamp,
    input_tokens: metric.input_tokens,
    output_tokens: metric.output_tokens,
    reasoning_tokens: metric.reasoning_tokens,
  }))

  if (chartData.length < 7) {
    const MS_PER_DAY = 24 * 60 * 60 * 1000
    const pads = []
    for (let i = chartData.length; i < 7; i++) {
      const padTimestamp = first.timestamp - MS_PER_DAY * (i - chartData.length + 1)
      pads.unshift({
        date: new Date(padTimestamp).toISOString().split('T')[0],
        timestamp: padTimestamp,
        input_tokens: 0,
        output_tokens: 0,
        reasoning_tokens: 0,
      })
    }
    chartData = [...pads, ...chartData]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-mono text-sm">{title ?? `Token Usage (${variant})`}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full font-mono">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              }}
            />

            <Bar
              dataKey="input_tokens"
              stackId="tokens"
              fill="var(--color-input_tokens)"
              radius={[0, 0, 2, 2]}
            />
            <Bar dataKey="output_tokens" stackId="tokens" fill="var(--color-output_tokens)" />
            <Bar
              dataKey="reasoning_tokens"
              stackId="tokens"
              fill="var(--color-reasoning_tokens)"
              radius={[2, 2, 0, 0]}
            />

            <ChartTooltip content={<CustomTooltipContent />} cursor={false} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
