'use client'

import { use } from 'react'

import { ModelPage } from '@/components/model-page'

export default function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const slug = use(params).slug.join('/')
  return <ModelPage slug={slug} />
}
