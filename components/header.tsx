'use client'

import Link from 'next/link'

import { parseAsString, useQueryState } from 'nuqs'

import { SearchInput } from '@/components/search-input'
import { SnapshotStatus } from '@/components/snapshot-status'
import { Button } from '@/components/ui/button'

import { ThemeButton } from './ui/theme-button'

export function Header() {
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''))
  const [page, setPage] = useQueryState('page', parseAsString)

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <h1 className="font-mono text-lg font-medium">ORCHID</h1>
            </Link>
            <nav className="flex items-center gap-2">
              <Link href="/">
                <Button 
                  variant={!page ? "default" : "ghost"} 
                  size="sm"
                  className="text-sm"
                >
                  Models
                </Button>
              </Link>
              <Link href="/?page=snapshots">
                <Button 
                  variant={page === 'snapshots' ? "default" : "ghost"} 
                  size="sm"
                  className="text-sm"
                >
                  Snapshots
                </Button>
              </Link>
            </nav>
          </div>
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
