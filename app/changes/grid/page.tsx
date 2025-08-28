import { Suspense } from 'react'

import { ChangesGridPageClient } from './changes-grid-page-client'

export default async function ChangesGridPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams

  return (
    <Suspense>
      <ChangesGridPageClient searchParams={params} />
    </Suspense>
  )
}