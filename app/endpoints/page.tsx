import { Suspense } from 'react'
import type { Metadata } from 'next'

import { EndpointsDataGridPage } from '@/components/endpoints-data-grid/endpoints-data-grid-page'

export const metadata: Metadata = {
  title: 'Endpoints',
  description: 'View and compare AI model endpoints available through OpenRouter',
}

export default function Page() {
  return (
    <Suspense>
      <EndpointsDataGridPage />
    </Suspense>
  )
}
