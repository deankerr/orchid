'use client'

import { AlertTriangleIcon } from 'lucide-react'

import { BrandIcon } from '@/components/brand-icon/brand-icon'
import { CopyToClipboardButton } from '@/components/copy-button'
import { EndpointPanel } from '@/components/endpoint-panel'
import { EndpointDataTable } from '@/components/endpoint-tables/endpoint-data-table'
import { ExternalLink } from '@/components/external-link'
import { DataStreamLoader, EmptyState } from '@/components/loading'
import { MarkdownLinks } from '@/components/markdown-links'
import { ModelAppsLeaderboard } from '@/components/model-apps-leaderboard'
import { ModelTokenChart } from '@/components/model-token-chart'
import { PageContainer, PageHeader, PageLoading, PageTitle } from '@/components/page-container'
import { Pill } from '@/components/pill'
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
      </PageHeader>

      {/* Model Data */}
      <div className="-mt-6 space-y-3">
        <CopyToClipboardButton
          value={model.slug}
          variant="ghost"
          size="sm"
          className="rounded-sm font-mono has-[>svg]:px-1"
        >
          {model.slug}
        </CopyToClipboardButton>
        {/* model attributes */}
        <div className="flex flex-wrap items-center gap-2 font-mono">
          <Pill label="Added">{formatIsoDate(model.or_created_at)}</Pill>
          <Pill label="Context">{model.context_length.toLocaleString()}</Pill>
          {model.instruct_type && <Pill label="Instruct Type">{model.instruct_type}</Pill>}
          {model.tokenizer && <Pill label="Tokenizer">{model.tokenizer}</Pill>}

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
      </div>

      {/* Endpoints  */}
      {model.endpoints && model.endpoints.length > 0 ? (
        <>
          <EndpointDataTable model={model} endpoints={model.endpoints} />

          {model.endpoints.map((endpoint) => (
            <EndpointPanel key={endpoint._id} endpoint={endpoint} />
          ))}
        </>
      ) : (
        <EmptyState message="No endpoints available" icon="⚡" />
      )}

      {/* Apps leaderboards */}
      {appLeaderboards === undefined ? (
        <DataStreamLoader label="Loading applications..." />
      ) : (
        appLeaderboards.map(
          (leaderboard) =>
            leaderboard && <ModelAppsLeaderboard key={leaderboard._id} leaderboard={leaderboard} />,
        )
      )}

      {/* Token stats charts */}
      {modelTokenStats === undefined ? (
        <DataStreamLoader label="Loading stats..." />
      ) : (
        modelTokenStats.map(
          (stats) => stats && <ModelTokenChart key={stats.model_variant} modelTokenStats={stats} />,
        )
      )}

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
    </PageContainer>
  )
}
