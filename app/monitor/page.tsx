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
    <PageContainer className="overflow-hidden">
      <PageHeader>
        <PageTitle>Monitor</PageTitle>
        <PageDescription>Monitor changes detected between OpenRouter snapshots.</PageDescription>
      </PageHeader>

      <MonitorFeed />
    </PageContainer>
  )
}
