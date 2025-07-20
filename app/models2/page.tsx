import { Suspense } from 'react'

import { ModelListPage } from './model-list-page'

export default function Page() {
  return (
    <Suspense>
      <ModelListPage />
    </Suspense>
  )
}
