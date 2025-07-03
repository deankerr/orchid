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
          <Link href="/">
            <h1 className="font-mono text-lg font-medium">ORCHID</h1>
          </Link>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search models..."
            className="w-80"
          />
          <div className="flex items-center gap-3">
            <SnapshotStatus />
            <ThemeButton />
          </div>
        </div>
      </div>
    </header>
  )
}
