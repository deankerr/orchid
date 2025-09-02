'use client'

import { memo } from 'react'

import { CornerDownRightIcon } from 'lucide-react'

import { BrandIcon } from '@/components/shared/brand-icon'
import { EntityAvatar } from '@/components/shared/entity-avatar'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { cn } from '@/lib/utils'

import { ComponentFrame } from '../component-frame'
import { ComponentSection } from '../component-section'

/* * DRAFT * */

type EndpointEntity = { name: string; slug: string; iconUrl?: string }

type EndpointIdentityProps = {
  model: EndpointEntity
  provider: EndpointEntity
  iconSize?: number
  overlap?: number
  previewOnHover?: boolean
  className?: string
}

/**
 * EndpointIdentity
 * Visual token for the composite identity "{Model} via {Provider}" with optional variant/status.
 * Purely presentational – no data fetching or integration.
 */
function IdentityRoot({
  layout,
  model,
  provider,
  iconSize = 24,
  overlap,
  previewOnHover = true,
  className,
}: EndpointIdentityProps & { layout: 'inline' | 'stacked' }) {
  const body = (
    <div className={cn('group flex min-w-0 items-center gap-2', className)}>
      {/* <div className="grid border border-dashed border-purple-700">
        <EntityAvatar
          src={model.iconUrl ?? ''}
          fallback={model.name}
          className="-top-2 -left-1 col-start-1 row-start-1 border bg-background"
        />
        <EntityAvatar
          src={provider.iconUrl ?? ''}
          fallback={provider.name}
          className="top-2 left-2 col-start-1 row-start-1 size-5 border bg-background"
        />
      </div> */}

      <div className={cn('min-w-0', layout === 'stacked' && 'leading-tight')}>
        {layout === 'stacked' ? (
          <div className="grid min-w-0 grid-rows-[1fr_auto] text-base">
            <div className="flex items-center gap-1">
              <EntityAvatar
                src={model.iconUrl ?? ''}
                fallback={model.name}
                className="size-[1.5em] border bg-muted p-0.5"
              />
              <div className="truncate font-medium">{model.name}</div>
            </div>

            <div className="flex items-center gap-1">
              <CornerDownRightIcon className="-mr-1 size-5 text-muted-foreground" />
              <EntityAvatar
                src={provider.iconUrl ?? ''}
                fallback={provider.name}
                className="size-[1.3em] border bg-muted p-0.5"
              />
              <div className="truncate font-medium">{provider.name}</div>
            </div>
          </div>
        ) : (
          <div className="min-w-0 truncate">
            <span className="font-medium">{model.name}</span>
            <span className="text-muted-foreground"> via </span>
            <span>{provider.name}</span>
          </div>
        )}
      </div>

      <div className="ml-auto" />
    </div>
  )

  if (!previewOnHover) return body

  return (
    <HoverCard>
      <HoverCardTrigger asChild>{body}</HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-3">
          <div className="flex items-center gap-1">
            <AvatarStack
              modelIconUrl={model.iconUrl}
              providerIconUrl={provider.iconUrl}
              size={iconSize}
              overlap={overlap}
            />
            <div className="min-w-0">
              <div className="truncate font-medium">
                {model.name}
                <span className="text-muted-foreground"> via </span>
                {provider.name}
              </div>
              <div className="truncate font-mono text-xs text-muted-foreground">
                {model.slug} · {provider.slug}
              </div>
            </div>
          </div>

          <EndpointPeekBody />
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

export const EndpointIdentityInline = memo(function EndpointIdentityInline(
  props: EndpointIdentityProps,
) {
  return <IdentityRoot layout="inline" {...props} />
})

export const EndpointIdentityStacked = memo(function EndpointIdentityStacked(
  props: EndpointIdentityProps,
) {
  return <IdentityRoot layout="stacked" {...props} />
})

function AvatarStack({
  modelIconUrl,
  providerIconUrl,
  size = 24,
}: {
  modelIconUrl?: string
  providerIconUrl?: string
  size?: number
  overlap?: number
}) {
  // const computedOverlap = typeof overlap === 'number' ? overlap : Math.round(size * 0.4)
  return (
    <div className="relative">
      <div className="absolute -top-2 rounded-sm border bg-muted p-0.5" style={{}}>
        <BrandIcon url={modelIconUrl} size={size} />
      </div>
      <div className="absolute top-2 rounded-sm border bg-background p-0.5">
        <BrandIcon url={providerIconUrl} size={size} />
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Showroom (designs only)
// ----------------------------------------------------------------------------

type PeekData = {
  context_length: number
  max_output: number
  throughput: number
  latency_ms: number
  price_in: number
  price_out: number
}

const EXAMPLES: Array<EndpointIdentityProps & { peek: PeekData }> = [
  {
    model: {
      name: 'Claude 3.5 Sonnet',
      slug: 'anthropic/claude-3.5-sonnet',
      iconUrl: '/icons/anthropic.png',
    },
    provider: { name: 'OpenRouter', slug: 'openrouter', iconUrl: '/icons/openrouter.png' },
    peek: {
      context_length: 200000,
      max_output: 8192,
      throughput: 180,
      latency_ms: 1100,
      price_in: 3.0,
      price_out: 15.0,
    },
  },
  {
    model: { name: 'GPT-4o', slug: 'openai/gpt-4o', iconUrl: '/icons/openai.png' },
    provider: { name: 'Together', slug: 'together', iconUrl: '/icons/together.png' },
    peek: {
      context_length: 128000,
      max_output: 4096,
      throughput: 220,
      latency_ms: 900,
      price_in: 5.0,
      price_out: 15.0,
    },
  },
  {
    model: {
      name: 'Llama 3.3 70B',
      slug: 'meta-llama/llama-3.3-70b-instruct',
      iconUrl: '/icons/meta.png',
    },
    provider: { name: 'DeepInfra', slug: 'deepinfra', iconUrl: '/icons/deepinfra.png' },
    peek: {
      context_length: 32768,
      max_output: 4096,
      throughput: 140,
      latency_ms: 1300,
      price_in: 0.2,
      price_out: 0.8,
    },
  },
  {
    model: { name: 'Mistral Small', slug: 'mistral/mistral-small', iconUrl: '/icons/mistral.png' },
    provider: { name: 'Groq', slug: 'groq', iconUrl: '/icons/groq.png' },
    peek: {
      context_length: 32000,
      max_output: 2048,
      throughput: 400,
      latency_ms: 600,
      price_in: 0.15,
      price_out: 0.6,
    },
  },
]

export function EndpointIdentitySet() {
  return (
    <>
      <ComponentSection
        className="md:grid-cols-2"
        title="Endpoint Identity – Default"
        description="Composite identity: {Model} via {Provider} with hover details."
      >
        {EXAMPLES.map((e, i) => (
          <ComponentFrame key={`d-${i}`} title="default">
            <EndpointIdentityInline {...e} overlap={8} />
          </ComponentFrame>
        ))}
      </ComponentSection>

      <ComponentSection
        className="md:grid-cols-2"
        title="Endpoint Identity – Stacked"
        description="Two-line layout for cards."
      >
        {EXAMPLES.map((e, i) => (
          <ComponentFrame key={`s-${i}`} title="stacked">
            <EndpointIdentityStacked {...e} overlap={22} />
          </ComponentFrame>
        ))}
      </ComponentSection>

      <ComponentSection
        className="md:grid-cols-2"
        title="Peek – Body"
        description="Card body content used in the hover. Visible here for iteration."
      >
        {EXAMPLES.map((e, i) => (
          <ComponentFrame key={`p-${i}`} title="peek body">
            <PeekCard>
              <EndpointPeekBody data={e.peek} />
            </PeekCard>
          </ComponentFrame>
        ))}
      </ComponentSection>
    </>
  )
}

function EndpointPeekBody({ data }: { data?: PeekData }) {
  const d = data ?? {
    context_length: 128000,
    max_output: 4096,
    throughput: 200,
    latency_ms: 1000,
    price_in: 1.0,
    price_out: 3.0,
  }

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-6">
      <div className="text-xs text-foreground-dim uppercase">{label}</div>
      <div className="font-mono text-sm">{value}</div>
    </div>
  )

  return (
    <div className="space-y-2">
      <Row label="Context" value={`${formatNum(d.context_length)} TOK`} />
      <Row label="Max Output" value={`${formatNum(d.max_output)} TOK`} />
      <Row label="TOK/S" value={formatNum(d.throughput)} />
      <Row label="Latency" value={`${(d.latency_ms / 1000).toFixed(2)} S`} />
      <Row label="Input" value={`$${d.price_in}/MTok`} />
      <Row label="Output" value={`$${d.price_out}/MTok`} />
    </div>
  )
}

function formatNum(n: number) {
  if (n >= 1000) return `${Math.round(n).toLocaleString()}`
  return `${n}`
}

// Visual wrapper to imitate hover card container in the playground
function PeekCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-80 rounded-md border bg-popover p-4 text-popover-foreground shadow-md">
      {children}
    </div>
  )
}
