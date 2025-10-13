import type { Metadata } from 'next'

import { MaterializedChangesDevPage } from '@/components/dev/materialized-changes/materialized-changes-dev-page'

export const metadata: Metadata = {
  title: 'Materialized Changes',
  description: 'Inspect latest materialized change documents',
}

export default function Page() {
  return <MaterializedChangesDevPage />
}
