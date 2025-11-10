'use client'

import { api } from '@/convex/_generated/api'

import { PageContainer, PageHeader, PageTitle } from '@/components/app-layout/pages'
import { EntityBadge } from '@/components/shared/entity-badge'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { getConvexHttpUrl } from '@/lib/utils'

function ExtLink({
  href,
  children = 'link',
  className = 'underline decoration-dotted underline-offset-2',
}: {
  href: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  )
}

export default function Page() {
  const models = useCachedQuery(api.db.or.views.models.list, {}, 'models-list')
  const providers = useCachedQuery(api.db.or.views.providers.list, {}, 'providers-list')

  return (
    <PageContainer className="gap-3">
      <PageHeader>
        <PageTitle>Resources</PageTitle>
      </PageHeader>

      <div className="flex gap-4 rounded border border-dashed p-4 font-mono text-xs">
        <div className="space-x-1">
          Models:
          <ExtLink href="https://openrouter.ai/api/v1/models">V1</ExtLink>
          <ExtLink href="https://openrouter.ai/api/frontend/models">FE</ExtLink>
        </div>
        <div className="space-x-1">
          Providers:
          <ExtLink href="https://openrouter.ai/api/frontend/all-providers">FE</ExtLink>
        </div>
        <div className="space-x-1">
          Analytics:
          <ExtLink href="https://openrouter.ai/api/frontend/models/find?">(Find)</ExtLink>
        </div>
        <div className="space-x-1">
          HTTP API:
          <ExtLink href={getConvexHttpUrl('/listmeps')}>listmeps</ExtLink>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-x-8 gap-y-6 rounded-sm border border-dashed p-4">
        {models
          ?.sort((a, b) => a.name.localeCompare(b.name))
          .map((m) => (
            <div key={m._id} className="flex justify-between gap-2">
              <EntityBadge name={m.name} slug={m.slug} />
              <div className="grid shrink-0 font-mono text-xs">
                <ExtLink href={`https://openrouter.ai/api/v1/models/${m.slug}/endpoints`}>
                  endp/V1
                </ExtLink>
                <ExtLink
                  href={`https://openrouter.ai/api/frontend/stats/endpoint?permaslug=${m.version_slug}`}
                >
                  endp/FE
                </ExtLink>
              </div>
            </div>
          ))}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-x-8 gap-y-6 rounded-sm border border-dashed p-4">
        {providers
          ?.sort((a, b) => a.name.localeCompare(b.name))
          .map((p) => (
            <div key={p._id} className="flex justify-between gap-2">
              <EntityBadge name={p.name} slug={p.slug} />
            </div>
          ))}
      </div>
    </PageContainer>
  )
}
