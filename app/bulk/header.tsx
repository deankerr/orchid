'use client'

import Link from 'next/link'

import { ThemeButton } from './ui/theme-button'

export function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto px-4 py-4 flex items-center justify-between">
        {/* Left side - Title */}
        <div>
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <h1 className="text-2xl font-semibold">ORCHID</h1>
            <p className="text-muted-foreground text-sm">
              OpenRouter Capability & Health Intelligence Dashboard
            </p>
          </Link>
        </div>

        {/* Right side - controls */}
        <div className="flex items-center gap-4">
          <ThemeButton />
        </div>
      </div>
    </header>
  )
}
