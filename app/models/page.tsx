import { Suspense } from 'react'
import type { Metadata } from 'next'

import { ModelFilterPage } from '../../components/model-endpoints-filter/models-filter-page'

export const metadata: Metadata = {
  title: 'Models - ORCHID',
  description: 'Browse and compare models available through OpenRouter',
}

export default function Page() {
  return (
    <Suspense>
      <ModelFilterPage />
    </Suspense>
  )
}
