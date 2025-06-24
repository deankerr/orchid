import { OrApp, OrAppTokenMetric } from '@/convex/types'

import { formatTokenCount } from '@/lib/utils'

import { ExternalLink } from './external-link'

type OrAppWithTokenMetrics = { app: OrApp | null; metric: OrAppTokenMetric }

function AppItem({ app, metric, rank }: { app: OrApp; metric: OrAppTokenMetric; rank: number }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">
          {rank}. {app.title || 'Untitled App'}
        </div>

        <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
          <ExternalLink href={app.origin_url}>{new URL(app.origin_url).hostname}</ExternalLink>
          {app.description && ` • ${app.description}`}
        </div>
      </div>

      <div className="text-right flex-shrink-0">
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
      <div className="text-sm text-muted-foreground font-mono">No apps found using this model</div>
    )
  }

  // Filter out apps without valid app data and limit to 20
  const validApps = apps.filter(({ app }) => app !== null).slice(0, 20) as Array<{
    app: OrApp
    metric: OrAppTokenMetric
  }>

  return (
    <div className="border rounded-sm font-mono">
      <div className="p-4 border-b">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x">
        {/* First column */}
        <div className="p-4 space-y-4">
          {validApps.slice(0, Math.ceil(validApps.length / 2)).map(({ app, metric }, index) => (
            <AppItem key={app.app_id} app={app} metric={metric} rank={index + 1} />
          ))}
        </div>

        {/* Second column - only show on lg+ screens and if there are enough apps */}
        {validApps.length > Math.ceil(validApps.length / 2) && (
          <div className="p-4 space-y-4 hidden lg:block">
            {validApps.slice(Math.ceil(validApps.length / 2)).map(({ app, metric }, index) => (
              <AppItem
                key={app.app_id}
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
