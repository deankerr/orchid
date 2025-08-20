import { Suspense } from 'react'
import type { Metadata } from 'next'

import { ChangesListPage } from './changes-list-page'

export const metadata: Metadata = {
  title: 'Changes - ORCHID',
  description: 'View changes detected between OpenRouter data snapshots',
}

export default function Page() {
  return (
    <Suspense>
      <ChangesListPage />
    </Suspense>
  )
}
