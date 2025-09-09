import { Suspense } from 'react'

import { EndpointsDataGridPage } from '@/components/endpoints-data-grid/endpoints-data-grid-page'

export default function Page() {
  return (
    <Suspense>
      <EndpointsDataGridPage />
    </Suspense>
  )
}
