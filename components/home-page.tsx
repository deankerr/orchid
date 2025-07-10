'use client'

import Link from 'next/link'

import { parseAsString, useQueryState } from 'nuqs'

import { DataStreamLoader } from '@/components/loading'
import { ModelList } from '@/components/model-list'
import { ModelPage } from '@/components/model-page'
import { SearchInput } from '@/components/search-input'
import { SnapshotDashboard } from '@/components/snapshot-dashboard/snapshot-dashboard'
import { SnapshotStatus } from '@/components/snapshot-status'
import { useFilteredModels } from '@/hooks/use-filtered-models'
import { useKeypress } from '@/hooks/use-keypress'

import { ThemeButton } from './ui/theme-button'

export function HomePage() {
  const [modelSlug, setModelSlug] = useQueryState('model', parseAsString)
  const [page] = useQueryState('page', parseAsString)
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
      <div className="container mx-auto space-y-6 px-4 py-6">
        {page === 'snapshots' ? (
          <SnapshotDashboard />
        ) : modelSlug ? (
          <ModelPage slug={modelSlug} />
        ) : filteredModels ? (
          <ModelList models={filteredModels} />
        ) : (
          <DataStreamLoader label="Loading models..." />
        )}
      </div>
    </AppLayout>
  )
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Header />
      {children}
    </div>
  )
}

export function Header() {
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''))

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex w-1/3 items-center gap-6">
            <Link href="/">
              <h1 className="font-mono text-lg font-medium">ORCHID</h1>
            </Link>
          </div>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search models..."
            className="w-80"
          />
          <div className="flex w-1/3 items-center justify-end gap-3">
            <Link href="/?page=snapshots">
              <SnapshotStatus />
            </Link>
            <ThemeButton />
          </div>
        </div>
      </div>
    </header>
  )
}
