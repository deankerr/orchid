'use client'

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

import type { Doc } from '@/convex/_generated/dataModel'
import { getModelVariantSlug } from '@/convex/shared'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { formatCompactNumber } from '@/lib/formatters'
import { formatIsoDate } from '@/lib/utils'

import { Separator } from './ui/separator'

const chartConfig = {
  input: {
    label: 'input',
    color: 'var(--chart-1)',
  },
  output: {
    label: 'output',
    color: 'var(--chart-2)',
  },
  reasoning: {
    label: 'reasoning',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig

// Format numbers with K/M/B suffixes
const formatNumber = (value: number) => {
  return formatCompactNumber(value)
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

export function ModelTokenChart({
  modelTokenStats,
}: {
  modelTokenStats: Doc<'or_model_token_stats'>
}) {
  const { stats, model_slug, model_variant } = modelTokenStats
  const variantSlug = getModelVariantSlug(model_slug, model_variant)

  // Get the first data point
  const first = stats[0]

  if (!first) {
    return (
      <Card className="rounded-sm">
        <CardHeader>
          <CardTitle className="font-mono text-sm">{variantSlug}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-mono text-sm text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    )
  }

  const pads: Doc<'or_model_token_stats'>['stats'] = []

  if (stats.length < 7) {
    const MS_PER_DAY = 24 * 60 * 60 * 1000
    for (let i = stats.length; i < 7; i++) {
      pads.unshift({
        timestamp: first.timestamp - MS_PER_DAY * (i - stats.length + 1),
        input: 0,
        output: 0,
        reasoning: 0,
        requests: 0,
      })
    }
  }

  const chartData = [...pads, ...stats].map((s) => ({
    ...s,
    date: new Date(s.timestamp).toISOString().split('T')[0],
  }))

  return (
    <Card className="rounded-sm">
      <CardHeader>
        <CardTitle className="font-mono text-sm">{`Tokens Processed: ${variantSlug}`}</CardTitle>
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

            <Bar dataKey="input" stackId="tokens" fill="var(--color-input)" radius={[0, 0, 2, 2]} />
            <Bar dataKey="output" stackId="tokens" fill="var(--color-output)" />
            <Bar
              dataKey="reasoning"
              stackId="tokens"
              fill="var(--color-reasoning)"
              radius={[2, 2, 0, 0]}
            />

            <ChartTooltip content={<CustomTooltipContent />} cursor={false} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
