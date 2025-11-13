import type { Metadata } from 'next'

import { ChangesFeedPage } from '@/components/changes-feed/feed-page'

export const metadata: Metadata = {
  title: 'Changes',
  description: 'View changes detected between OpenRouter snapshots',
}

export default function Page() {
  return <ChangesFeedPage />
}
