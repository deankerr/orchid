import type { Metadata } from 'next'

import { ChangesDataGridPage } from '@/components/changes-data-grid/changes-data-grid-page'

export const metadata: Metadata = {
  title: 'Changes',
  description: 'View changes detected between OpenRouter snapshots',
}

export default function Page() {
  return <ChangesDataGridPage />
}
