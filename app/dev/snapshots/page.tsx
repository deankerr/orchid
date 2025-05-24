'use client'

import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'

export default function SnapshotsPage() {
  const snapshot = useQuery(api.snapshots.getLatestModelEndpointsSnapshot)
  return (
    <div>
      <pre className="font-mono text-sm m-8">{JSON.stringify(snapshot, null, 2)}</pre>
    </div>
  )
}
