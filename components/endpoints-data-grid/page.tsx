'use client'

import { parseAsInteger, useQueryState } from 'nuqs'

import { api } from '@/convex/_generated/api'

import { useCachedQuery } from '@/hooks/use-cached-query'

import { PageDescription, PageHeader, PageTitle } from '../app-layout/pages'
import { DataGridFrame } from '../shared/data-grid-frame'
import { EndpointsDataGridControls } from './controls'
import { EndpointsDataGrid, EndpointsDataGridTable } from './data-grid'
import { EndpointsDataGridFooter } from './footer'

export function EndpointsDataGridPage() {
  const [limit] = useQueryState('limit', parseAsInteger.withDefault(99999))

  const endpointsList = useCachedQuery(api.db.or.views.endpoints.all, { limit }, 'endpoints-all')

  return (
    <>
      <PageHeader>
        <PageTitle>Endpoints</PageTitle>
        <PageDescription>Browse models and providers available on OpenRouter</PageDescription>
      </PageHeader>

      <EndpointsDataGrid data={endpointsList}>
        <DataGridFrame>
          <EndpointsDataGridControls />
          <EndpointsDataGridTable />
          <EndpointsDataGridFooter />
        </DataGridFrame>
      </EndpointsDataGrid>
    </>
  )
}
