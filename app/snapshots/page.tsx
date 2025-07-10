import { Suspense } from 'react'

import { SnapshotDashboard } from '@/components/snapshot-dashboard/snapshot-dashboard'

export default function Page() {
  return (
    <Suspense>
      <SnapshotDashboard />
    </Suspense>
  )
}
