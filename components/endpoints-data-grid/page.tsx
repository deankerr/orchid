'use client'

import { useMemo, useState } from 'react'

import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { api } from '@/convex/_generated/api'

import { useCachedQuery } from '@/hooks/use-cached-query'
import { attributes } from '@/lib/attributes'

import { PageDescription, PageHeader, PageTitle } from '../app-layout/pages'
import { DataGrid, useDataGrid } from '../data-grid/data-grid'
import {
  DataGridCard,
  DataGridCardContent,
  DataGridCardFooter,
  DataGridCardToolbar,
} from '../data-grid/data-grid-card'
import { fuzzyFilter } from '../data-grid/data-grid-fuzzy'
import { DataGridTableVirtual } from '../data-grid/data-grid-table'
import { columns } from './columns'
import { Controls } from './controls'
import { useEndpointFilters } from './use-endpoint-filters'

export function EndpointsDataGridPage() {
  const [cellBorder, setCellBorder] = useState(false)

  return (
    <>
      <PageHeader>
        <PageTitle>Endpoints</PageTitle>
        <PageDescription>Browse models and providers available on OpenRouter</PageDescription>
      </PageHeader>

      <EndpointsDataGrid cellBorder={cellBorder}>
        <DataGridCard>
          <DataGridCardToolbar>
            <Controls cellBorder={cellBorder} setCellBorder={setCellBorder} />
          </DataGridCardToolbar>

          <DataGridCardContent>
            <DataGridTableVirtual />
          </DataGridCardContent>

          <DataGridCardFooter>
            <Footer />
          </DataGridCardFooter>
        </DataGridCard>
      </EndpointsDataGrid>
    </>
  )
}

function useEndpointsListQuery() {
  return useCachedQuery(api.db.or.views.endpoints.all, {}, 'endpoints-all')
}

function EndpointsDataGrid({
  children,
  cellBorder,
}: {
  children: React.ReactNode
  cellBorder: boolean
}) {
  const endpointsList = useEndpointsListQuery()
  const { globalFilter, sorting, onSortingChange, attributeFilters } = useEndpointFilters()

  const filteredEndpoints = useMemo(() => {
    if (!endpointsList) return []

    return endpointsList.filter((endpoint) => {
      for (const [filterName, mode] of Object.entries(attributeFilters)) {
        let hasAttribute = false

        // Handle modality filters
        if (filterName === 'image_input') {
          hasAttribute = endpoint.model.input_modalities.includes('image')
        } else if (filterName === 'file_input') {
          hasAttribute = endpoint.model.input_modalities.includes('file')
        } else if (filterName === 'audio_input') {
          hasAttribute = endpoint.model.input_modalities.includes('audio')
        } else if (filterName === 'image_output') {
          hasAttribute = endpoint.model.output_modalities.includes('image')
        } else {
          // Handle regular attribute filters
          const attr = attributes[filterName as keyof typeof attributes]
          if (attr) {
            hasAttribute = attr.has(endpoint)
          }
        }

        if (mode === 'include' && !hasAttribute) {
          return false
        }
        if (mode === 'exclude' && hasAttribute) {
          return false
        }
      }

      return true
    })
  }, [endpointsList, attributeFilters])

  const table = useReactTable({
    columns,
    data: filteredEndpoints,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    globalFilterFn: 'fuzzy',
    state: {
      globalFilter,
      sorting,
    },
    onSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row._id,
    manualPagination: true,
  })

  return (
    <DataGrid
      table={table}
      recordCount={table.getFilteredRowModel().rows.length}
      isLoading={!endpointsList}
      loadingMessage="Loading endpoints..."
      emptyMessage="No endpoints found"
      skeletonRows={30}
      tableLayout={{
        headerSticky: true,
        width: 'fixed',
        cellBorder,
        virtualized: true,
        rowHeight: 58.5,
        overscan: 20,
      }}
      tableClassNames={{
        headerRow: 'uppercase font-mono text-[12px]',
        bodyRow:
          'has-aria-[label=disabled]:[&_td_>_*]:opacity-50 has-aria-[label=disabled]:[&_td]:text-foreground/50 has-aria-[label=gone]:[&_td_>_*]:opacity-50 has-aria-[label=gone]:[&_td]:text-foreground/50',
        body: 'font-mono',
      }}
    >
      {children}
    </DataGrid>
  )
}

function Footer() {
  const { table } = useDataGrid()
  const endpointsList = useEndpointsListQuery()
  const { hasActiveFilters } = useEndpointFilters()

  if (!endpointsList) return null

  const totalEndpoints = endpointsList
  const totalModelsCount = new Set(totalEndpoints.map((endp) => endp.model.slug)).size

  const totalAvailableEndpoints = totalEndpoints.filter((endp) => !endp.unavailable_at)
  const totalAvailableModelsCount = new Set(totalAvailableEndpoints.map((endp) => endp.model.slug))
    .size

  const filteredEndpoints = table.getFilteredRowModel().rows.map((row) => row.original)
  const filteredModelsCount = new Set(filteredEndpoints.map((endp) => endp.model.slug)).size

  return (
    <div className="flex flex-wrap justify-center gap-x-4">
      <div>
        Models:{' '}
        {hasActiveFilters
          ? `${filteredModelsCount} filtered`
          : `${totalAvailableModelsCount} available`}{' '}
        ({totalModelsCount} total)
      </div>
      <div>
        Endpoints:{' '}
        {hasActiveFilters
          ? `${filteredEndpoints.length} filtered`
          : `${totalAvailableEndpoints.length} available`}{' '}
        ({totalEndpoints.length} total)
      </div>
    </div>
  )
}
