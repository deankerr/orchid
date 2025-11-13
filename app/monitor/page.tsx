import type { Metadata } from 'next'

import { PageDescription, PageHeader, PageTitle } from '@/components/app-layout/pages'
import { MonitorFeed } from '@/components/monitor-feed/monitor-feed-page'

export const metadata: Metadata = {
  title: 'Monitor',
  description: 'Monitor changes detected between OpenRouter snapshots.',
}

export default function Page() {
  return (
    <>
      <PageHeader>
        <PageTitle>Monitor</PageTitle>
        <PageDescription>Monitor changes detected between OpenRouter snapshots.</PageDescription>
      </PageHeader>

      <div className="px-6 py-4">
        <MonitorFeed />
      </div>
    </>
  )
}
