'use client'

import { useDeferredValue } from 'react'

import { parseAsString, useQueryState } from 'nuqs'

import { AppLayout } from '@/components/app-layout'
import { DataStreamLoader } from '@/components/loading'
import { ModelList } from '@/components/model-list'
import { ModelPage } from '@/components/model-page'
import { PageContainer } from '@/components/page-container'
import { useFilteredModels } from '@/hooks/use-filtered-models'

export default function Home() {
  const [modelSlug] = useQueryState('model', parseAsString)
  const filteredModels = useFilteredModels()
  const deferredModels = useDeferredValue(filteredModels)

  return (
    <AppLayout>
      <PageContainer>
        {modelSlug ? (
          <ModelPage slug={modelSlug} />
        ) : deferredModels ? (
          <ModelList models={deferredModels} />
        ) : (
          <DataStreamLoader label="Loading models..." />
        )}
      </PageContainer>
    </AppLayout>
  )
}
