import type { Metadata } from 'next'

import { PageContainer, PageHeader, PageTitle } from '@/components/app-layout/pages'

import { DemoRadBadgeComponents } from './demo-rad-badge'

export const metadata: Metadata = {
  title: 'Component Demos',
}

export default function Page() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Component Library</PageTitle>
      </PageHeader>

      <div className="grid divide-y px-3">
        <DemoRadBadgeComponents />
      </div>
    </PageContainer>
  )
}
