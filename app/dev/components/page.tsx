import { Suspense } from 'react'
import type { Metadata } from 'next'

import { ComponentLibrary } from './component-library'

export const metadata: Metadata = {
  title: 'Components',
  description: 'Development component library and design system showcase',
}

export default function ComponentLibraryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ComponentLibrary />
    </Suspense>
  )
}
