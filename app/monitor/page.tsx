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
  description: 'Changes detected between snapshots of the OpenRouter APIs',
}

export default function Page() {
  return (
    <PageContainer className="overflow-hidden px-0 pb-0 sm:px-0 sm:pb-0">
      <PageHeader>
        <PageTitle>Monitor</PageTitle>
        <PageDescription>Changes detected between snapshots of the OpenRouter APIs</PageDescription>
      </PageHeader>

      <MonitorFeed />
    </PageContainer>
  )
}
