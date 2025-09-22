'use client'

import { api } from '@/convex/_generated/api'

import { useCachedQuery } from '@/hooks/use-cached-query'

import { PageDescription, PageHeader, PageTitle } from '../app-layout/pages'
import { DataGridFrame } from '../shared/data-grid-frame'
import { EndpointsDataGridControls } from './controls'
import { EndpointsDataGrid, EndpointsDataGridTable } from './data-grid'
import { EndpointsDataGridFooter } from './footer'

export function EndpointsPage() {
  const endpointsList = useCachedQuery(
    api.db.or.views.endpoints.all,
    { limit: 200 },
    'endpoints-all',
  )

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
