'use client'

import { AlertTriangleIcon, FileUpIcon, ImageUpIcon } from 'lucide-react'

import { BrandIcon } from '@/components/brand-icon'
import { CopyButton } from '@/components/copy-button'
import { EndpointCard } from '@/components/endpoint-card'
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
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useModelAppsLeaderboards, useModelData, useModelTokenMetrics } from '@/hooks/api'
import { formatIsoDate } from '@/lib/utils'

export function ModelPage({ slug }: { slug: string }) {
  const model = useModelData(slug)

  const leaderboardsMap = useModelAppsLeaderboards(model?.permaslug)
  const modelTokenMetrics = useModelTokenMetrics(model?.permaslug)

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
    <PageContainer className="space-y-7">
      <PageHeader>
        <PageTitle>
          <BrandIcon slug={model.slug} size={24} fallback="model" />
          {model.name}
          <CopyButton value={model.slug} variant="ghost" />
        </PageTitle>
      </PageHeader>

      <div className="flex flex-wrap gap-2 font-mono">
        {model.input_modalities.includes('image') && (
          <Badge variant="outline">
            <span>
              <ImageUpIcon className="size-4" />
            </span>
            images
          </Badge>
        )}

        {model.input_modalities.includes('file') && (
          <Badge variant="outline">
            <span>
              <FileUpIcon className="size-4" />
            </span>
            pdf
          </Badge>
        )}

        <Pill label="added">{formatIsoDate(model.or_created_at)}</Pill>
        <Pill label="context_length">{model.context_length.toLocaleString()}</Pill>
        <Pill label="tokenizer">{model.tokenizer}</Pill>
        {model.instruct_type && <Pill label="instruct_type">{model.instruct_type}</Pill>}
      </div>

      {/*  description */}
      {model.description && (
        <p className="text-sm text-muted-foreground">
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

      <div className="flex gap-4 font-mono text-sm">
        <ExternalLink href={`https://openrouter.ai/${model.slug}`}>OpenRouter</ExternalLink>
        {model.hugging_face_id && (
          <ExternalLink href={`https://huggingface.co/${model.hugging_face_id}`}>
            HuggingFace
          </ExternalLink>
        )}
      </div>

      {/* Endpoints  */}
      {model.endpoints && model.endpoints.length > 0 ? (
        <>
          <Card className="rounded-none py-2">
            <EndpointDataTable model={model} endpoints={model.endpoints} />
          </Card>

          {model.endpoints.map((endpoint) => (
            <EndpointCard key={endpoint._id} endpoint={endpoint} />
          ))}
        </>
      ) : (
        <EmptyState message="No endpoints available" icon="⚡" />
      )}

      {/* Apps leaderboards */}
      {leaderboardsMap === undefined ? (
        <DataStreamLoader label="Loading applications..." />
      ) : (
        [...leaderboardsMap.values()].map((leaderboard) => (
          <ModelAppsLeaderboard key={leaderboard._id} leaderboard={leaderboard} />
        ))
      )}

      {/* Token metrics charts */}
      {modelTokenMetrics === undefined ? (
        <DataStreamLoader label="Loading metrics..." />
      ) : (
        model.variants.map((variant) => (
          <ModelTokenChart
            key={variant}
            data={modelTokenMetrics[variant] ?? []}
            variant={variant}
            title={`Tokens: ${model.slug}${variant !== 'standard' ? `:${variant}` : ''}`}
          />
        ))
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
