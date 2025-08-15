'use client'

import { AlertTriangleIcon } from 'lucide-react'

import { getModelVariantSlug } from '@/convex/shared'

import { BrandIcon } from '@/components/brand-icon/brand-icon'
import { FeatureFlag } from '@/components/dev-utils/feature-flag'
import { EndpointDataTable } from '@/components/endpoint-data-table/endpoint-data-table'
import { EndpointPanel } from '@/components/endpoint-panel/endpoint-panel'
import { ModelAppsLeaderboard } from '@/components/model-apps-leaderboard'
import { ModelTokenChart } from '@/components/model-token-chart'
import { CopyToClipboardButton } from '@/components/shared/copy-to-clipboard-button'
import { ExternalLink } from '@/components/shared/external-link'
import { LoaderBadge } from '@/components/shared/loader'
import { MarkdownLinks } from '@/components/shared/markdown-links'
import {
  PageContainer,
  PageHeader,
  PageLoading,
  PageTitle,
} from '@/components/shared/page-container'
import { Pill } from '@/components/shared/pill'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useModelAppsLeaderboards, useModelData, useModelTokenStats } from '@/hooks/api'
import { formatIsoDate } from '@/lib/utils'

export function ModelPage({ slug }: { slug: string }) {
  const model = useModelData(slug)
  const appLeaderboards = useModelAppsLeaderboards(model)
  const modelTokenStats = useModelTokenStats(model)

  if (!model) {
    if (model === null) {
      return (
        <PageContainer>
          <PageHeader>
            <PageTitle>Model not found</PageTitle>
          </PageHeader>
          <p className="text-muted-foreground">
            The model &ldquo;{slug}&rdquo; could not be found.
          </p>
        </PageContainer>
      )
    }
    return <PageLoading />
  }

  return (
    <PageContainer className="space-y-12">
      <PageHeader>
        <PageTitle>
          <BrandIcon slug={model.slug} size={24} />
          {model.name}
        </PageTitle>

        {/* slug copy buttons */}
        <div className="flex items-center gap-2 font-mono">
          {model.variants.map((v) => {
            const variantSlug = getModelVariantSlug(model.slug, v)
            return (
              <CopyToClipboardButton
                key={variantSlug}
                value={variantSlug}
                variant="secondary"
                size="sm"
                className="rounded-sm [&_svg]:size-3"
              >
                {variantSlug}
              </CopyToClipboardButton>
            )
          })}
        </div>

        {/* Model Data */}
        {/* model attributes */}
        <div className="flex flex-wrap items-center gap-2 font-mono">
          <Pill label="Added">{formatIsoDate(model.or_created_at)}</Pill>
          <Pill label="Context">{model.context_length.toLocaleString()}</Pill>

          {model.input_modalities.includes('image') && <Pill label="Modality">IMAGE</Pill>}
          {model.input_modalities.includes('file') && <Pill label="Modality">PDF</Pill>}
        </div>

        {/*  description */}
        {model.description && (
          <p className="py-2 text-sm text-foreground-dim">
            <MarkdownLinks>{model.description}</MarkdownLinks>
          </p>
        )}

        {model.warning_message && (
          <div className="flex items-center gap-2 rounded border border-warning px-3 py-2.5 text-sm text-warning">
            <AlertTriangleIcon className="size-5" />
            <div>
              <MarkdownLinks>{model.warning_message}</MarkdownLinks>
            </div>
          </div>
        )}

        {/* External links */}
        <div className="flex gap-4 text-sm">
          <ExternalLink href={`https://openrouter.ai/${model.slug}`}>OpenRouter</ExternalLink>
          {model.hugging_face_id && (
            <ExternalLink href={`https://huggingface.co/${model.hugging_face_id}`}>
              HuggingFace
            </ExternalLink>
          )}
        </div>
      </PageHeader>

      {/* Endpoints  */}
      {model.endpoints && model.endpoints.length > 0 ? (
        <>
          <EndpointDataTable endpoints={model.endpoints} />

          <FeatureFlag flag="endpoint-panels">
            {model.endpoints.map((endpoint) => (
              <EndpointPanel key={endpoint._id} endpoint={endpoint} />
            ))}
          </FeatureFlag>
        </>
      ) : (
        <p className="text-muted-foreground">No endpoints found.</p>
      )}

      {/* Token stats charts */}
      {modelTokenStats === undefined ? (
        <LoaderBadge />
      ) : (
        modelTokenStats.map(
          (stats) => stats && <ModelTokenChart key={stats.model_variant} modelTokenStats={stats} />,
        )
      )}

      {/* Apps leaderboards */}
      {appLeaderboards === undefined ? (
        <LoaderBadge />
      ) : (
        appLeaderboards.map(
          (leaderboard) =>
            leaderboard && (
              <ModelAppsLeaderboard
                key={leaderboard._id}
                leaderboard={leaderboard}
                title={`Apps Leaderboard: ${getModelVariantSlug(model.slug, leaderboard.model_variant)}`}
              />
            ),
        )
      )}

      <FeatureFlag flag="snapshots">
        <Accordion type="single" collapsible className="bg-muted/30">
          <AccordionItem value="model-data" className="border-b-0">
            <AccordionTrigger className="px-4 font-mono text-sm">Raw</AccordionTrigger>
            <AccordionContent className="px-4">
              <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                {JSON.stringify(model, null, 2)}
              </pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </FeatureFlag>
    </PageContainer>
  )
}
