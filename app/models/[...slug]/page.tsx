import { Suspense } from 'react'
import type { Metadata } from 'next'

import { fetchQuery } from 'convex/nextjs'

import { api } from '@/convex/_generated/api'

import { ModelPage } from './model-page'

type Props = {
  params: Promise<{ slug: string[] }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = decodeURIComponent((await params).slug.join('/'))

  try {
    const model = await fetchQuery(api.public.models.get, { slug })

    if (!model) {
      return {
        title: 'Model Not Found - ORCHID',
        description: 'The requested model could not be found',
      }
    }

    return {
      title: `${model.name} - ORCHID`,
      description: `${model.name} (${model.slug}) - AI model details, endpoints, and metrics on OpenRouter`,
    }
  } catch {
    return {
      title: 'Model - ORCHID',
      description: 'AI model details and metrics',
    }
  }
}

export default async function Page({ params }: Props) {
  const slug = decodeURIComponent((await params).slug.join('/'))
  return (
    <Suspense>
      <ModelPage slug={slug} />
    </Suspense>
  )
}
