import { Suspense } from 'react'

import { HomePage } from '@/components/home-page'
import { DataStreamLoader } from '@/components/loading'

export default function Home() {
  return (
    <Suspense fallback={<DataStreamLoader label="Loading..." />}>
      <HomePage />
    </Suspense>
  )
}
