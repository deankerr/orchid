'use client'

import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/convex/_generated/api'

import { SheetHeader, SheetTitle } from '@/components/ui/sheet'

import { DataList, DataListItem, DataListLabel, DataListValue } from '../shared/data-list'
import { EntityBadge } from '../shared/entity-badge'
import { ExternalLink } from '../shared/external-link'
import { EntitySheetHeader, EntitySheetSection } from './entity-sheet-components'
import { useEntitySheet } from './use-entity-sheet'

export function ProviderSheet({ slug }: { slug: string }) {
  const { openModel } = useEntitySheet()

  const { data: provider, isPending: providerPending } = useQuery(
    convexQuery(api.providers.getBySlug, { slug }),
  )

  const { data: endpoints, isPending: endpointsPending } = useQuery(
    convexQuery(api.endpoints.listForProvider, { providerSlug: slug }),
  )

  const { data: changes, isPending: changesPending } = useQuery(
    convexQuery(api.changes.getProviderChanges, { providerSlug: slug, limit: 20 }),
  )

  if (providerPending) {
    return (
      <>
        <SheetTitle className="sr-only">Loading Provider</SheetTitle>
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </>
    )
  }

  if (!provider) {
    return (
      <>
        <SheetTitle className="sr-only">Provider Not Found</SheetTitle>
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Provider not found</div>
        </div>
      </>
    )
  }

  const handleCopySlug = async () => {
    try {
      await navigator.clipboard.writeText(provider.slug)
      toast.success(`Copied to clipboard: ${provider.slug}`)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <>
      <SheetTitle className="sr-only">{provider.name}</SheetTitle>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <SheetHeader>
          <EntitySheetHeader
            type="provider"
            slug={provider.slug}
            name={provider.name}
            onSlugClick={handleCopySlug}
          />
        </SheetHeader>

        {/* OpenRouter Link */}
        <div className="px-4">
          <ExternalLink href={`https://openrouter.ai/providers/${provider.slug}`}>
            View on OpenRouter
          </ExternalLink>
        </div>

        {/* Details Section */}
        <EntitySheetSection title="Details">
          <DataList>
            {provider.headquarters && (
              <DataListItem>
                <DataListLabel>Headquarters</DataListLabel>
                <DataListValue>{provider.headquarters}</DataListValue>
              </DataListItem>
            )}
            {provider.datacenters && provider.datacenters.length > 0 && (
              <DataListItem>
                <DataListLabel>Datacenters</DataListLabel>
                <DataListValue>{provider.datacenters.join(', ')}</DataListValue>
              </DataListItem>
            )}
            {provider.status_page_url && (
              <DataListItem>
                <DataListLabel>Status Page</DataListLabel>
                <DataListValue>
                  <ExternalLink href={provider.status_page_url}>Link</ExternalLink>
                </DataListValue>
              </DataListItem>
            )}
            {provider.terms_of_service_url && (
              <DataListItem>
                <DataListLabel>Terms of Service</DataListLabel>
                <DataListValue>
                  <ExternalLink href={provider.terms_of_service_url}>Link</ExternalLink>
                </DataListValue>
              </DataListItem>
            )}
            {provider.privacy_policy_url && (
              <DataListItem>
                <DataListLabel>Privacy Policy</DataListLabel>
                <DataListValue>
                  <ExternalLink href={provider.privacy_policy_url}>Link</ExternalLink>
                </DataListValue>
              </DataListItem>
            )}
          </DataList>
        </EntitySheetSection>

        {/* Related Endpoints Section */}
        <EntitySheetSection title={`Endpoints (${endpoints?.length ?? '...'})`}>
          {endpointsPending ? (
            <div className="text-sm text-muted-foreground">Loading endpoints...</div>
          ) : endpoints && endpoints.length > 0 ? (
            <div className="space-y-2">
              {endpoints.map((endpoint) => (
                <div
                  key={endpoint._id}
                  className="flex items-center justify-between rounded-xs border p-2"
                >
                  <EntityBadge
                    name={endpoint.model.name}
                    slug={endpoint.model.slug}
                    onBadgeClick={() => openModel(endpoint.model.slug)}
                  />
                  {endpoint.context_length && (
                    <span className="font-mono text-xs text-muted-foreground">
                      {endpoint.context_length.toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No endpoints found</div>
          )}
        </EntitySheetSection>

        {/* Change History Section */}
        <EntitySheetSection title={`Recent Changes (${changes?.length ?? '...'})`}>
          {changesPending ? (
            <div className="text-sm text-muted-foreground">Loading changes...</div>
          ) : changes && changes.length > 0 ? (
            <div className="space-y-2">
              {changes.map((change, idx) => (
                <div key={idx} className="rounded-xs border p-2">
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className="font-mono text-xs"
                      style={{
                        color:
                          change.change_kind === 'create'
                            ? 'hsl(var(--chart-2))'
                            : change.change_kind === 'delete'
                              ? 'hsl(var(--chart-1))'
                              : 'hsl(var(--chart-3))',
                      }}
                    >
                      {change.change_kind}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {new Date(change.crawl_id).toLocaleDateString()}
                    </span>
                  </div>
                  {change.path && (
                    <div className="font-mono text-xs text-muted-foreground">{change.path}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No recent changes</div>
          )}
        </EntitySheetSection>
      </div>
    </>
  )
}
