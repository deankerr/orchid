'use client'

import Link from 'next/link'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { EpochDisplay, useCurrentEpoch } from './EpochDisplay'

export function Header() {
  const currentEpoch = useCurrentEpoch()
  const latestProcessedEpoch = useQuery(api.frontend.getLatestProcessedEpoch)

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Left side - Title */}
        <div>
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <h1 className="text-4xl font-bold">ORCHID</h1>
            <p className="text-muted-foreground text-sm">
              OpenRouter Capability & Health Intelligence Dashboard
            </p>
          </Link>
        </div>

        {/* Right side - Dev controls */}
        <div className="flex items-center gap-4">
          {/* Epoch status */}
          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="flex items-center gap-1">
              <span className="">Last:</span>
              <EpochDisplay epoch={currentEpoch} />
            </div>
            {latestProcessedEpoch && (
              <div className="flex items-center gap-1">
                <span className="">Data:</span>
                <EpochDisplay epoch={latestProcessedEpoch} />
              </div>
            )}
          </div>

          {/* Sync status indicator */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-muted-foreground">Sync Active</span>
          </div>

          {/* Dev buttons */}
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 text-xs font-mono border rounded hover:bg-muted/50 transition-colors"
              onClick={() => console.log('Trigger sync')}
            >
              Sync Now
            </button>
            <button
              className="px-3 py-1 text-xs font-mono border rounded hover:bg-muted/50 transition-colors"
              onClick={() => console.log('Process projections')}
            >
              Process
            </button>
            <button
              className="px-3 py-1 text-xs font-mono border rounded hover:bg-muted/50 transition-colors"
              onClick={() => console.log('View logs')}
            >
              Logs
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
