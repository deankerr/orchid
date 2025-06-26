'use client'

import { parseAsString, useQueryState } from 'nuqs'

import { AppLayout } from '@/components/app-layout'
import { DataStreamLoader } from '@/components/loading'
import { ModelList } from '@/components/model-list'
import { ModelPage } from '@/components/model-page'
import { PageContainer } from '@/components/page-container'
import { useFilteredModels } from '@/hooks/use-filtered-models'
import { useKeypress } from '@/hooks/use-keypress'

export function HomePage() {
  const [modelSlug, setModelSlug] = useQueryState('model', parseAsString)
  const filteredModels = useFilteredModels()

  // Keyboard navigation for model pages
  useKeypress(
    modelSlug && filteredModels
      ? {
          ArrowRight: () => {
            const currentIndex = filteredModels.findIndex((model) => model.slug === modelSlug)
            if (currentIndex !== -1) {
              const nextIndex = (currentIndex + 1) % filteredModels.length
              setModelSlug(filteredModels[nextIndex].slug)
            }
          },
          ArrowLeft: () => {
            const currentIndex = filteredModels.findIndex((model) => model.slug === modelSlug)
            if (currentIndex !== -1) {
              const prevIndex = (currentIndex - 1 + filteredModels.length) % filteredModels.length
              setModelSlug(filteredModels[prevIndex].slug)
            }
          },
        }
      : {},
  )

  return (
    <AppLayout>
      <PageContainer>
        {modelSlug ? (
          <ModelPage slug={modelSlug} />
        ) : filteredModels ? (
          <ModelList models={filteredModels} />
        ) : (
          <DataStreamLoader label="Loading models..." />
        )}
      </PageContainer>
    </AppLayout>
  )
}
