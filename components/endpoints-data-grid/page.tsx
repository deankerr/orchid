'use client'

import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { parseAsInteger, useQueryState } from 'nuqs'

import { api } from '@/convex/_generated/api'
import { Doc } from '@/convex/_generated/dataModel'

import { useCachedQuery } from '@/hooks/use-cached-query'

import { PageDescription, PageHeader, PageTitle } from '../app-layout/pages'
import { DataGrid } from '../data-grid/data-grid'
import { DataGridCard, DataGridCardContent, DataGridCardFooter } from '../data-grid/data-grid-card'
import { DataGridTable } from '../data-grid/data-grid-table'
import { columns } from './columns'
import { EndpointsDataGridControls } from './controls'

export function EndpointsDataGridPage() {
  const [limit] = useQueryState('limit', parseAsInteger.withDefault(99999))

  const endpointsList = useCachedQuery(api.db.or.views.endpoints.all, { limit }, 'endpoints-all')

  const table = useReactTable({
    data: endpointsList ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row._id,
  })

  return (
    <>
      <PageHeader>
        <PageTitle>Endpoints</PageTitle>
        <PageDescription>Browse models and providers available on OpenRouter</PageDescription>
      </PageHeader>

      <DataGrid
        table={table}
        recordCount={table.getFilteredRowModel().rows.length}
        isLoading={!endpointsList}
        loadingMessage="Loading endpoints..."
        emptyMessage="No endpoints found"
        skeletonRows={20}
        tableLayout={{
          headerSticky: true,
          width: 'fixed',
        }}
        tableClassNames={{
          headerRow: 'uppercase font-mono text-[12px]',
          bodyRow: 'has-aria-[label=disabled]:opacity-50 has-aria-[label=gone]:opacity-50',
          body: 'font-mono',
        }}
      >
        <DataGridCard>
          <EndpointsDataGridControls />

          <DataGridCardContent>
            <DataGridTable />
          </DataGridCardContent>

          <Footer endpointsList={endpointsList} />
        </DataGridCard>
      </DataGrid>
    </>
  )
}

function Footer({ endpointsList }: { endpointsList?: Doc<'or_views_endpoints'>[] }) {
  return (
    <DataGridCardFooter className="content-center text-center">
      {endpointsList ? (
        <div className="">
          Models: {new Set(endpointsList.map((endp) => endp.model.slug)).size} | Endpoints:{' '}
          {endpointsList.filter((endp) => !endp.unavailable_at).length} available,{' '}
          {endpointsList.filter((endp) => endp.unavailable_at).length} unavailable,{' '}
          {endpointsList.length} total
        </div>
      ) : (
        <div>Loading</div>
      )}
    </DataGridCardFooter>
  )
}
