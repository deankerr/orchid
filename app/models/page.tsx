import type { Metadata } from 'next'

import { ModelsPage } from './models-page'

export const metadata: Metadata = {
  title: 'Models - ORCHID',
  description: 'Browse and compare AI models available through OpenRouter',
}

export default function Page() {
  return <ModelsPage />
}
