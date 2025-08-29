import { Suspense } from 'react'

import { ChangesGridPage } from '../../../components/changes-data-grid/changes-grid-page'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams

  return (
    <Suspense>
      <ChangesGridPage searchParams={params} />
    </Suspense>
  )
}
