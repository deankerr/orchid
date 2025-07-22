import type { Metadata } from 'next'

import { ModelListPage } from './models-list-page'

export const metadata: Metadata = {
  title: 'Models - ORCHID',
  description: 'Browse and compare models available through OpenRouter',
}

export default function Page() {
  return <ModelListPage />
}
