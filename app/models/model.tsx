import { useQuery } from 'convex-helpers/react/cache/hooks'

import {
  BrainIcon,
  FileUpIcon,
  ImageUpIcon,
  OctagonAlertIcon,
  ToolCaseIcon,
  TriangleAlertIcon,
} from 'lucide-react'

import { api } from '@/convex/_generated/api'

import { BrandIcon } from '@/components/brand-icon'
import { Badge } from '@/components/ui/badge'
import { useOrProviders } from '@/hooks/api'
import { cn } from '@/lib/utils'

import type { ModelWithEndpoint } from './page'

interface ModelProps {
  model: ModelWithEndpoint
}

function formatTokenPriceToM(value?: number) {
  if (value === undefined) return '    -'
  return `${(value * 1_000_000).toFixed(2)}`
}

export function useProviderIcon(slug: string) {
  const providers = useOrProviders()
  if (!providers) return
  return providers.find((p) => p.slug === slug)?.icon.url ?? null
}

export function Model({ model: m }: ModelProps) {
  const providers = useQuery(api.frontend.listOrProviders)

  return (
    <div key={m.variantSlug} className="min-w-60 space-y-4 rounded-sm border bg-card px-4 py-3.5">
      {/* title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <BrandIcon slug={m.variantSlug} size={24} />
          <div className="truncate font-semibold">{m.model.name}</div>
          {m.variant !== 'standard' && (
            <Badge variant="default" className="font-mono">
              :{m.variant}
            </Badge>
          )}
        </div>

        <div className="flex grow items-center justify-between font-mono text-sm">
          <div className="flex flex-wrap items-center gap-1 font-mono">
            {m.unionCapabilities.includes('tools') && (
              <Badge variant="secondary">
                <span>
                  <ToolCaseIcon className="size-4" />
                </span>
                tools
              </Badge>
            )}
            {m.unionCapabilities.includes('reasoning') && (
              <Badge variant="secondary">
                <span>
                  <BrainIcon className="size-4" />
                </span>
                reasoning
              </Badge>
            )}
            {m.unionCapabilities.includes('image_input') && (
              <Badge variant="secondary">
                <span>
                  <ImageUpIcon className="size-4" />
                </span>
                images
              </Badge>
            )}
            {m.unionCapabilities.includes('file_input') && (
              <Badge variant="secondary">
                <span>
                  <FileUpIcon className="size-4" />
                </span>
                pdf
              </Badge>
            )}
          </div>
          <div className="text-right text-xs">tokens_7d: {m.tokens_7d.toLocaleString()}</div>
        </div>
      </div>

      {m.model.warning_message && (
        <div className="rounded-sm border border-warning p-2 text-xs text-warning">
          <TriangleAlertIcon className="-mt-0.5 mr-2 inline-flex size-3.5" />
          {m.model.warning_message}
        </div>
      )}

      {/* endpoints */}
      <div className="-mx-1 space-y-1.5 text-foreground/90">
        {m.endpoints
          .sort((a, b) => (b.traffic ?? -1) - (a.traffic ?? -1))
          .map((endp) => (
            <div
              key={endp._id}
              className="flex items-center justify-between gap-6 border px-1.5 py-2 dark:bg-black/20"
            >
              {/* icon / name */}
              <div className="flex grow items-center gap-3 pl-0.5">
                <BrandIcon
                  slug={endp.provider_slug}
                  fallbackSrc={providers?.find((p) => p.slug === endp.provider_slug)?.icon.url}
                  size={18}
                />
                <div className="truncate text-sm font-medium">{endp.provider_name}</div>
                {endp.is_disabled && (
                  <Badge variant="destructive" className="font-mono">
                    <OctagonAlertIcon />
                    DISABLED
                  </Badge>
                )}
              </div>

              {/* context */}
              <div className="flex justify-end gap-1 text-right font-mono text-sm">
                <div
                  className={cn(
                    'w-28 space-x-0.5',
                    endp.context_length < m.model.context_length && 'text-muted-foreground',
                  )}
                >
                  <span>{endp.context_length.toLocaleString()}</span>
                  <span className="text-[11px]">TOK</span>
                </div>

                {/* max output */}
                <div className="w-28 space-x-0.5">
                  <span>
                    {endp.limits.output_tokens?.toLocaleString() ??
                      endp.context_length.toLocaleString()}
                  </span>
                  <span className="text-[11px]">TOK</span>
                </div>

                {/* throughput */}
                <div className="w-24 space-x-0.5">
                  <span>{endp.stats?.p50_throughput.toFixed(1) ?? '-'}</span>
                  <span className="text-[11px]">TOK/s</span>
                </div>

                {/* price */}
                <div className="w-24 space-x-0.5">
                  <span className="">${formatTokenPriceToM(endp.pricing.input)}</span>
                  <span className="text-[11px]">/MTOK</span>
                </div>

                {/* traffic */}
                <div className="w-13 space-x-0.5">
                  <span className="">{endp.traffic ? (endp.traffic * 100).toFixed(1) : '-'}</span>
                  <span className="text-[11px]">%</span>
                </div>
                <div className="w-4">
                  {endp.status < 0 && (
                    <TriangleAlertIcon className="-mt-0.5 inline-flex size-4 text-warning" />
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
