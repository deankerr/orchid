'use client'

import Link from 'next/link'

import { parseAsString, useQueryState } from 'nuqs'

import { SearchInput } from '@/components/search-input'

import { ThemeButton } from './ui/theme-button'

export function Header() {
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''))

  return (
    <header className="border-b bg-background">
      <div className="mx-auto max-w-7xl px-4 py-3">
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
          <ThemeButton />
        </div>
      </div>
    </header>
  )
}
