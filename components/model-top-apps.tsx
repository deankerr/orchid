import { OrApp, OrAppTokenMetric } from '@/convex/types'

import { formatTokenCount } from '@/lib/utils'

import { ExternalLink } from './external-link'

type OrAppWithTokenMetrics = { app: OrApp | null; metric: OrAppTokenMetric }

function AppItem({ app, metric, rank }: { app: OrApp; metric: OrAppTokenMetric; rank: number }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">
          {rank}. {app.title || 'Untitled App'}
        </div>

        <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
          <ExternalLink href={app.origin_url}>{new URL(app.origin_url).hostname}</ExternalLink>
          {app.description && ` • ${app.description}`}
        </div>
      </div>

      <div className="flex-shrink-0 text-right">
        <div className="text-sm font-medium">{formatTokenCount(metric.total_tokens)}</div>
        <div className="text-xs text-muted-foreground">tokens</div>
      </div>
    </div>
  )
}

export function ModelTopApps({
  apps,
  title = 'Top Apps',
}: {
  apps: OrAppWithTokenMetrics[]
  title?: string
}) {
  if (!apps.length) {
    return (
      <div className="font-mono text-sm text-muted-foreground">No apps found using this model</div>
    )
  }

  // Filter out apps without valid app data and limit to 20
  const validApps = apps.filter(({ app }) => app !== null).slice(0, 20) as Array<{
    app: OrApp
    metric: OrAppTokenMetric
  }>

  return (
    <div className="rounded-sm border font-mono">
      <div className="border-b p-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x">
        {/* First column */}
        <div className="space-y-4 p-4">
          {validApps.slice(0, Math.ceil(validApps.length / 2)).map(({ app, metric }, index) => (
            <AppItem key={metric._id} app={app} metric={metric} rank={index + 1} />
          ))}
        </div>

        {/* Second column - only show on lg+ screens and if there are enough apps */}
        {validApps.length > Math.ceil(validApps.length / 2) && (
          <div className="hidden space-y-4 p-4 lg:block">
            {validApps.slice(Math.ceil(validApps.length / 2)).map(({ app, metric }, index) => (
              <AppItem
                key={metric._id}
                app={app}
                metric={metric}
                rank={Math.ceil(validApps.length / 2) + index + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
