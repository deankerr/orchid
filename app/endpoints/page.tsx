import { Suspense } from 'react'
import type { Metadata } from 'next'

import { PageDescription, PageHeader, PageTitle } from '@/components/app-layout/pages'
import { EndpointsDataGrid } from '@/components/endpoints-data-grid/page'

export const metadata: Metadata = {
  title: 'Endpoints',
  description: 'View and compare AI model endpoints available through OpenRouter',
}

export default function Page() {
  return (
    <>
      <PageHeader>
        <PageTitle>Endpoints</PageTitle>
        <PageDescription>Browse models and providers available on OpenRouter</PageDescription>
      </PageHeader>

      <Suspense>
        <EndpointsDataGrid />
      </Suspense>
    </>
  )
}
