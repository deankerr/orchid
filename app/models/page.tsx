import type { Metadata } from 'next'

import { ModelsListPage } from './models-list-page'

export const metadata: Metadata = {
  title: 'Models - ORCHID',
  description: 'Browse and compare AI models available through OpenRouter',
}

export default function Page() {
  return <ModelsListPage />
}
