'use client'

import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { parseAsInteger, useQueryState } from 'nuqs'

import { api } from '@/convex/_generated/api'

import { useCachedQuery } from '@/hooks/use-cached-query'

import { PageDescription, PageHeader, PageTitle } from '../app-layout/pages'
import { DataGrid } from '../data-grid/data-grid'
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

export function EndpointsDataGridPage() {
  return (
    <>
      <PageHeader>
        <PageTitle>Endpoints</PageTitle>
        <PageDescription>Browse models and providers available on OpenRouter</PageDescription>
      </PageHeader>

      <EndpointsDataGrid>
        <DataGridCard>
          <DataGridCardToolbar>
            <Controls />
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
  const [limit] = useQueryState('limit', parseAsInteger.withDefault(99999))
  return useCachedQuery(api.db.or.views.endpoints.all, { limit }, 'endpoints-all')
}

function EndpointsDataGrid({ children }: { children: React.ReactNode }) {
  const endpointsList = useEndpointsListQuery()

  const table = useReactTable({
    columns,
    data: endpointsList ?? [],
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    globalFilterFn: 'fuzzy',
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
        cellBorder: false,
        virtualized: true,
        rowHeight: 58.5,
        overscan: 20,
      }}
      tableClassNames={{
        headerRow: 'uppercase font-mono text-[12px]',
        bodyRow: 'has-aria-[label=disabled]:opacity-50 has-aria-[label=gone]:opacity-50',
        body: 'font-mono',
      }}
    >
      {children}
    </DataGrid>
  )
}

function Footer() {
  const endpointsList = useEndpointsListQuery()
  if (!endpointsList) return null

  const availableEndpoints = endpointsList.filter((endp) => !endp.unavailable_at)
  const totalModelsCount = new Set(endpointsList.map((endp) => endp.model.slug)).size
  const availableModelsCount = new Set(availableEndpoints.map((endp) => endp.model.slug)).size

  return `Models: ${availableModelsCount} available (${totalModelsCount} total) ⋅ Endpoints: ${availableEndpoints.length} available (${endpointsList.length} total)`
}
