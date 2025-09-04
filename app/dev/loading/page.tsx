import type { Metadata } from 'next'

import { PageLoading } from '@/components/app-layout/pages'

export const metadata: Metadata = {
  title: 'Loading',
}

export default function Page() {
  return <PageLoading />
}
