'use client'

import { useMemo } from 'react'

import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table'

import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'

import { PageHeader, PageTitle } from '@/components/app-layout/pages'
import { DataGrid } from '@/components/data-grid/data-grid'
import { DataGridCard, DataGridCardContent } from '@/components/data-grid/data-grid-card'
import { fuzzyFilter } from '@/components/data-grid/data-grid-fuzzy'
import { DataGridTableVirtual } from '@/components/data-grid/data-grid-table'
import { Skeleton } from '@/components/ui/skeleton'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { formatPrice } from '@/lib/formatters'

type ChangeDoc = Doc<'or_views_changes'>

export function MaterializedChangesDevPage() {
  const allChanges = useCachedQuery(api.db.or.views.changes.dev_collect, {}, 'changes-dev-collect')

  const columns = useMemo<ColumnDef<ChangeDoc>[]>(
    () => [
      {
        accessorFn: (row) => Number(row.crawl_id),
        header: 'Timestamp',
        cell: ({ getValue, row }) => {
          const timestamp = getValue<number | undefined>()
          const formattedTimestamp = formatTimestamp(timestamp)
          const crawlId = row.original.crawl_id
          const signature = crawlId ? getCrawlSignature(crawlId) : null

          return (
            <div
              className="flex items-center gap-2"
              title={crawlId ? `Crawl ${crawlId}` : undefined}
            >
              {signature ? (
                <span
                  className="flex h-6 items-center gap-1 rounded-full border px-2 text-[11px] leading-none"
                  style={{
                    borderColor: signature.accent,
                    backgroundColor: signature.surface,
                    color: signature.accent,
                  }}
                >
                  <span aria-hidden>{signature.emoji}</span>
                  <span className="font-mono">{formatCrawlIdShort(crawlId)}</span>
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
              <span className="font-mono text-xs text-muted-foreground" title={formattedTimestamp}>
                {formattedTimestamp}
              </span>
            </div>
          )
        },
        size: 180,
        meta: {
          skeleton: <Skeleton className="h-8 w-full" />,
        },
      },
      {
        accessorKey: 'entity_type',
        header: 'Entity',
        size: 100,
        cell: ({ getValue }) => renderEntityType(getValue<'model' | 'endpoint' | 'provider'>()),
        meta: {
          skeleton: <Skeleton className="h-5 w-full" />,
        },
      },
      {
        accessorKey: 'change_kind',
        header: 'Kind',
        size: 100,
        cell: ({ getValue }) => renderChangeKind(getValue<'create' | 'update' | 'delete'>()),
        meta: {
          skeleton: <Skeleton className="h-5 w-full" />,
        },
      },
      {
        accessorKey: 'model_slug',
        header: 'Model',
        size: 300,
        meta: {
          skeleton: <Skeleton className="h-5 w-full" />,
        },
      },
      {
        accessorFn: (row) => row.endpoint_uuid?.slice(0, 4),
        header: 'Endpoint',
        size: 100,
        meta: {
          skeleton: <Skeleton className="h-5 w-full" />,
        },
      },
      {
        accessorFn: (row) => row.provider_tag_slug ?? row.provider_slug,
        header: 'Provider',
        size: 180,
        meta: {
          skeleton: <Skeleton className="h-5 w-full" />,
        },
      },
      {
        accessorKey: 'path',
        header: 'Path',
        size: 220,
        meta: {
          skeleton: <Skeleton className="h-5 w-full" />,
        },
      },
      {
        id: 'before',
        header: 'Before',
        cell: ({ row }) =>
          row.original.change_kind === 'update'
            ? renderValue(row.original.before, row.original)
            : '',
        size: 320,
      },
      {
        id: 'after',
        header: 'After',
        cell: ({ row }) =>
          row.original.change_kind === 'update'
            ? renderValue(row.original.after, row.original)
            : '',
        size: 320,
      },
    ],
    [],
  )

  const table = useReactTable({
    columns,
    data: allChanges ?? [],
    getRowId: (row) => row._id,
    getCoreRowModel: getCoreRowModel(),
    filterFns: {
      fuzzy: fuzzyFilter,
    },
  })

  const isLoading = !allChanges

  return (
    <>
      <PageHeader>
        <PageTitle>Materialized Changes</PageTitle>
      </PageHeader>

      <DataGridCard>
        <DataGrid
          table={table}
          recordCount={allChanges?.length ?? 0}
          isLoading={isLoading}
          loadingMessage="Loading materialized changes…"
          emptyMessage="No materialized changes found for the latest crawl"
          skeletonRows={20}
          tableLayout={{
            headerSticky: true,
            width: 'fixed',
            virtualized: true,
            rowHeight: 58.5,
            overscan: 12,
          }}
          tableClassNames={{
            headerRow: 'uppercase font-mono text-[12px]',
            body: 'font-mono text-xs',
          }}
        >
          <DataGridCardContent>
            <DataGridTableVirtual />
          </DataGridCardContent>
        </DataGrid>
      </DataGridCard>
    </>
  )
}

function formatTimestamp(timestamp?: number) {
  if (!timestamp) return '—'
  const date = new Date(timestamp)
  return `${date.toISOString().slice(0, 19).replace('T', ' ')}`
}

function getCrawlSignature(crawlId: string) {
  const numeric = Number.parseInt(crawlId, 10)
  if (!Number.isFinite(numeric)) {
    return {
      accent: 'hsl(var(--muted-foreground))',
      surface: 'hsl(var(--muted))',
      emoji: '❔',
    }
  }

  const hue = Math.abs(numeric % 360)
  const accent = `hsl(${hue}deg 70% 52%)`
  const surface = `hsl(${hue}deg 82% 94%)`
  const emojiPalette = ['🟣', '🔵', '🟢', '🟡', '🟠', '🔴', '🟤', '⚪️', '⚫️', '🟧'] as const
  const emoji = emojiPalette[Math.abs(numeric) % emojiPalette.length]

  return { accent, surface, emoji }
}

function formatCrawlIdShort(crawlId: string) {
  return crawlId.slice(-3)
}

function tryFormatPriceValue(value: number, change: ChangeDoc) {
  if (change.path_level_1 !== 'pricing') return null

  const priceKey = change.path_level_2 ?? change.path?.split('.').pop()
  if (!priceKey) return null

  try {
    return formatPrice({ priceKey, priceValue: value })
  } catch {
    return null
  }
}

function renderValue(value: unknown, change?: ChangeDoc) {
  if (value === undefined) return <span className="text-muted-foreground">undefined</span>
  if (value === null) return <span className="text-muted-foreground">null</span>

  if (typeof value === 'number') {
    const formatted = change ? tryFormatPriceValue(value, change) : null
    if (formatted) {
      return (
        <span className="font-mono" title={String(value)}>
          {formatted}
        </span>
      )
    }

    return <span className="font-mono">{value.toLocaleString()}</span>
  }

  const stringified = typeof value === 'string' ? value : JSON.stringify(value)

  return <pre className="max-h-40 overflow-auto rounded bg-muted/40 p-2">{stringified}</pre>
}

function renderEntityType(value?: 'model' | 'endpoint' | 'provider') {
  if (!value) return <span className="text-muted-foreground">—</span>
  const color =
    value === 'model' ? 'text-sky-500' : value === 'endpoint' ? 'text-purple-500' : 'text-amber-500'
  return <span className={`font-semibold uppercase ${color}`}>{value}</span>
}

function renderChangeKind(value?: 'create' | 'update' | 'delete') {
  if (!value) return <span className="text-muted-foreground">—</span>
  const color =
    value === 'create' ? 'text-emerald-500' : value === 'update' ? 'text-blue-500' : 'text-red-500'
  return <span className={`font-semibold uppercase ${color}`}>{value}</span>
}
