import type { Metadata } from 'next'

import {
  PageContainer,
  PageDescription,
  PageHeader,
  PageTitle,
} from '@/components/app-layout/pages'
import { MonitorFeed } from '@/components/monitor-feed/monitor-feed-page'

export const metadata: Metadata = {
  title: 'Monitor',
  description: 'Monitor changes detected between OpenRouter snapshots.',
}

export default function Page() {
  return (
    <PageContainer className="overflow-hidden px-0 pb-0 sm:px-0 sm:pb-0">
      <PageHeader className="px-6">
        <PageTitle>Monitor</PageTitle>
        <PageDescription>Monitor changes detected between OpenRouter snapshots.</PageDescription>
      </PageHeader>

      <MonitorFeed />
    </PageContainer>
  )
}
