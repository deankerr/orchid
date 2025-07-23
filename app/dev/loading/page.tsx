import type { Metadata } from 'next'

import {
  PageContainer,
  PageHeader,
  PageLoading,
  PageTitle,
} from '@/components/shared/page-container'

export const metadata: Metadata = {
  title: 'Loading',
}

export default function Page() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Loading</PageTitle>
      </PageHeader>

      <PageLoading />
    </PageContainer>
  )
}
