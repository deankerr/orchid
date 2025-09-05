import type { Doc } from '@/convex/_generated/dataModel'

import { formatCompactNumber } from '@/lib/formatters'

import { ExternalLink } from '../shared/external-link'

function LeaderboardItem({
  app,
  rank,
}: {
  app: Doc<'or_model_app_leaderboards'>['apps'][number]
  rank: number
}) {
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
        <div className="text-sm font-medium">{formatCompactNumber(app.total_tokens)}</div>
        <div className="text-xs text-muted-foreground">tokens</div>
      </div>
    </div>
  )
}

export function ModelAppsLeaderboard({
  leaderboard,
  title = 'Apps Leaderboard',
}: {
  leaderboard: Doc<'or_model_app_leaderboards'>
  title?: string
}) {
  const { apps } = leaderboard

  return (
    <div className="relative rounded-sm border font-mono">
      <div className="border-b p-4">
        <div className="flex items-center text-sm font-medium">{title}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x">
        {/* First column */}
        <div className="space-y-4 p-4">
          {apps.slice(0, Math.ceil(apps.length / 2)).map((app, index) => (
            <LeaderboardItem key={app.app_id} app={app} rank={index + 1} />
          ))}
        </div>

        {/* Second column - only show on md+ screens and if there are enough apps */}
        {apps.length > Math.ceil(apps.length / 2) && (
          <div className="hidden space-y-4 p-4 md:block">
            {apps.slice(Math.ceil(apps.length / 2)).map((app, index) => (
              <LeaderboardItem
                key={app.app_id}
                app={app}
                rank={Math.ceil(apps.length / 2) + index + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
