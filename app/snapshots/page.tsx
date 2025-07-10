import { Suspense } from 'react'
import type { Metadata } from 'next'

import { SnapshotDashboard } from '@/components/snapshot-dashboard/snapshot-dashboard'

export const metadata: Metadata = {
  title: 'Snapshots - ORCHID',
  description: 'View and manage OpenRouter data snapshots and processing status',
}

export default function Page() {
  return (
    <Suspense>
      <SnapshotDashboard />
    </Suspense>
  )
}
