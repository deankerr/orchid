'use client'

import { api } from '@/convex/_generated/api'

import { useCachedQuery } from '@/hooks/use-cached-query'

import { PageDescription, PageHeader, PageTitle } from '../app-layout/pages'
import { EndpointsControls } from './controls'
import { EndpointsFooter, EndpointsFrame } from './frame'
import { EndpointsProvider, EndpointsTable } from './provider'

export function EndpointsPage() {
  const endpointsList = useCachedQuery(api.db.or.views.endpoints.all, {}, 'endpoints-all')

  return (
    <>
      <PageHeader>
        <PageTitle>Endpoints</PageTitle>
        <PageDescription>Browse models and providers available on OpenRouter</PageDescription>
      </PageHeader>

      <EndpointsProvider data={endpointsList}>
        <EndpointsFrame>
          <EndpointsControls />
          <EndpointsTable />
          <EndpointsFooter />
        </EndpointsFrame>
      </EndpointsProvider>
    </>
  )
}
