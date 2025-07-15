import { memo } from 'react'
import Link from 'next/link'

import { BrainIcon, FileUpIcon, ImageUpIcon, ToolCaseIcon } from 'lucide-react'

import { BrandIcon } from '@/components/brand-icon/brand-icon'
import { Badge } from '@/components/ui/badge'
import { type EndpointsByVariant } from '@/hooks/api'
import { cn, formatIsoDate } from '@/lib/utils'

function formatTokenPriceToM(value?: number) {
  if (value === undefined) return ' - '
  return `${(value * 1_000_000).toFixed(2)}`
}

function ModelEBV_({ ebv }: { ebv: EndpointsByVariant[number] }) {
  const unionCapabilities = [
    ...new Set(
      ebv.endpoints.flatMap((endp) =>
        Object.entries(endp.capabilities)
          .filter(([, value]) => value === true)
          .map(([key]) => key),
      ),
    ),
  ]

  return (
    <div className="min-w-60 space-y-4 rounded-sm border bg-card px-4 py-3.5">
      {/* title */}
      <div className="flex items-center gap-4">
        <Link
          href={`/models/${ebv.model.slug}`}
          className="flex items-center gap-3 underline-offset-2 hover:underline"
        >
          <BrandIcon slug={ebv.model_variant_slug} size={24} />

          <div className="truncate font-semibold">{ebv.model.name}</div>
          {ebv.model_variant && (
            <Badge variant="default" className="font-mono">
              :{ebv.model_variant}
            </Badge>
          )}
        </Link>

        <div className="flex grow items-center justify-between font-mono text-sm">
          <div className="flex flex-wrap items-center gap-1 font-mono">
            {unionCapabilities.includes('tools') && (
              <Badge variant="secondary">
                <span>
                  <ToolCaseIcon className="size-4" />
                </span>
                tools
              </Badge>
            )}
            {unionCapabilities.includes('reasoning') && (
              <Badge variant="secondary">
                <span>
                  <BrainIcon className="size-4" />
                </span>
                reasoning
              </Badge>
            )}
            {unionCapabilities.includes('image_input') && (
              <Badge variant="secondary">
                <span>
                  <ImageUpIcon className="size-4" />
                </span>
                images
              </Badge>
            )}
            {unionCapabilities.includes('file_input') && (
              <Badge variant="secondary">
                <span>
                  <FileUpIcon className="size-4" />
                </span>
                pdf
              </Badge>
            )}
          </div>
          <div className="text-right text-xs">
            created: {formatIsoDate(ebv.model.or_created_at)}
            <br />
            tokens_7d: {ebv.tokens_7d.toLocaleString()}
          </div>
        </div>
      </div>

      {/* endpoints */}
      <div className="mb-1 text-sm font-medium">Top Endpoint</div>
      <div className="-mx-1 space-y-1.5 text-foreground/90">
        {ebv.endpoints.slice(0, 1).map((endp) => (
          <div
            key={endp._id}
            className="relative flex items-center justify-between gap-6 border px-1.5 py-2 dark:bg-black/20"
          >
            {/* icon / name */}
            <div className="flex grow items-center gap-3 pl-0.5">
              <BrandIcon slug={endp.provider_slug} size={18} />
              <div className="truncate text-sm font-medium">{endp.provider_name}</div>
            </div>

            {/* context */}
            <div className="flex justify-end gap-1 text-right font-mono text-sm">
              <div
                className={cn(
                  'w-28 space-x-0.5',
                  endp.context_length < ebv.model.context_length && 'text-muted-foreground',
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
              <div className="w-16 space-x-0.5">
                <span className="">
                  {endp.traffic_share ? (endp.traffic_share * 100).toFixed(1) : '-'}
                </span>
                <span className="text-[11px]">%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const ModelEBV = memo(ModelEBV_)
