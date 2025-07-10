import type { Metadata } from 'next'

import { ProvidersPage } from './providers-page'

export const metadata: Metadata = {
  title: 'Providers - ORCHID',
  description: 'Browse AI model providers available through OpenRouter',
}

export default function Page() {
  return <ProvidersPage />
}
