'use client'

import Link from 'next/link'

import { parseAsString, useQueryState } from 'nuqs'

import { SearchInput } from '@/components/search-input'
import { SnapshotStatus } from '@/components/snapshot-status'

import { ThemeButton } from './ui/theme-button'

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
