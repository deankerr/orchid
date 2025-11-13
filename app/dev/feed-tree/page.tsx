import type { Metadata } from 'next'

import { PageHeader, PageTitle } from '@/components/app-layout/pages'

import { FeedTree } from './feed-tree'

export const metadata: Metadata = {
  title: 'Feed Tree',
  description: 'Feed Tree',
}

export default function Page() {
  return (
    <>
      <PageHeader>
        <PageTitle>Feed Tree</PageTitle>
      </PageHeader>

      <FeedTree />
    </>
  )
}
