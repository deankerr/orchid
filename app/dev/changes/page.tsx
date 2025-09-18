import type { Metadata } from 'next'

import { ChangesListDevPage } from './changes-list-dev-page'

export const metadata: Metadata = {
  title: 'Changes',
  description: 'View changes detected between OpenRouter data snapshots',
}

export default function Page() {
  return <ChangesListDevPage />
}
