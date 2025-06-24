'use client'

import { use } from 'react'

import { EndpointCard } from '@/components/endpoint-card'
import { ModelCard } from '@/components/model-card'
import { ModelTopApps } from '@/components/model-top-apps'
import { PageContainer } from '@/components/page-container'
import { useOrEndpoints, useOrModel, useOrTopAppsForModel } from '@/hooks/api'

export default function ModelPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const slug = use(params).slug.join('/')
  const model = useOrModel(slug)
  const endpoints = useOrEndpoints(slug)
  const apps = useOrTopAppsForModel(slug, 'standard')
  const appsFree = useOrTopAppsForModel(slug, 'free')

  if (!model) {
    if (model === null) {
      return (
        <PageContainer>
          <div className="font-mono">Model not found</div>
        </PageContainer>
      )
    } else {
      return (
        <PageContainer>
          <div className="font-mono">Loading...</div>
        </PageContainer>
      )
    }
  }

  return (
    <PageContainer>
      <ModelCard model={model} />
      {apps && <ModelTopApps apps={apps} title="Top Apps" />}
      {appsFree && <ModelTopApps apps={appsFree} title="Top Apps (Free)" />}
      {endpoints?.map((endpoint) => <EndpointCard key={endpoint._id} endpoint={endpoint} />)}
    </PageContainer>
  )
}
