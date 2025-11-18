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

export function ModelSheet({ slug }: { slug: string }) {
  const { openProvider } = useEntitySheet()

  const { data: model, isPending: modelPending } = useQuery(
    convexQuery(api.models.getBySlug, { slug }),
  )

  const { data: endpoints, isPending: endpointsPending } = useQuery(
    convexQuery(api.endpoints.listForModel, { modelSlug: slug }),
  )

  const { data: changes, isPending: changesPending } = useQuery(
    convexQuery(api.changes.getModelChanges, { modelSlug: slug, limit: 20 }),
  )

  if (modelPending) {
    return (
      <>
        <SheetTitle className="sr-only">Loading Model</SheetTitle>
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </>
    )
  }

  if (!model) {
    return (
      <>
        <SheetTitle className="sr-only">Model Not Found</SheetTitle>
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Model not found</div>
        </div>
      </>
    )
  }

  const handleCopySlug = async () => {
    try {
      await navigator.clipboard.writeText(model.slug)
      toast.success(`Copied to clipboard: ${model.slug}`)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <>
      <SheetTitle className="sr-only">{model.name}</SheetTitle>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <SheetHeader>
          <EntitySheetHeader
            type="model"
            slug={model.slug}
            name={model.name}
            onSlugClick={handleCopySlug}
          />
        </SheetHeader>

        {/* External Links */}
        <div className="flex flex-col gap-1 px-4">
          <ExternalLink href={`https://openrouter.ai/${model.slug}`}>
            View on OpenRouter
          </ExternalLink>
          {model.hugging_face_id && (
            <ExternalLink href={`https://huggingface.co/${model.hugging_face_id}`}>
              View on Hugging Face
            </ExternalLink>
          )}
        </div>

        {/* Details Section */}
        <EntitySheetSection title="Details">
          <DataList>
            <DataListItem>
              <DataListLabel>Author</DataListLabel>
              <DataListValue>{model.author_name}</DataListValue>
            </DataListItem>

            <DataListItem>
              <DataListLabel>Input Modalities</DataListLabel>
              <DataListValue>{model.input_modalities.join(', ')}</DataListValue>
            </DataListItem>

            <DataListItem>
              <DataListLabel>Output Modalities</DataListLabel>
              <DataListValue>{model.output_modalities.join(', ')}</DataListValue>
            </DataListItem>

            <DataListItem>
              <DataListLabel>Reasoning</DataListLabel>
              <DataListValue>{model.reasoning ? 'Yes' : 'No'}</DataListValue>
            </DataListItem>

            {model.tokenizer && (
              <DataListItem>
                <DataListLabel>Tokenizer</DataListLabel>
                <DataListValue>{model.tokenizer}</DataListValue>
              </DataListItem>
            )}

            {model.instruct_type && (
              <DataListItem>
                <DataListLabel>Instruct Type</DataListLabel>
                <DataListValue>{model.instruct_type}</DataListValue>
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
                    name={endpoint.provider.name}
                    slug={endpoint.provider.tag_slug}
                    onBadgeClick={() => openProvider(endpoint.provider.slug)}
                  />
                  {endpoint.provider.region && (
                    <span className="font-mono text-xs text-muted-foreground">
                      {endpoint.provider.region}
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
