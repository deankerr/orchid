import { Suspense } from 'react'
import type { Metadata } from 'next'

import {
  PageContainer,
  PageDescription,
  PageHeader,
  PageTitle,
} from '@/components/app-layout/pages'
import { EndpointsDataGrid } from '@/components/endpoints-data-grid/page'

export const metadata: Metadata = {
  title: 'Endpoints',
  description: 'View and compare AI model endpoints available through OpenRouter',
}

export default function Page() {
  return (
    <PageContainer className="overflow-hidden px-0 pb-0 sm:px-0 sm:pb-0">
      <PageHeader className="px-6">
        <PageTitle>Endpoints</PageTitle>
        <PageDescription>Browse models and providers available on OpenRouter</PageDescription>
      </PageHeader>

      <Suspense>
        <EndpointsDataGrid />
      </Suspense>
    </PageContainer>
  )
}
