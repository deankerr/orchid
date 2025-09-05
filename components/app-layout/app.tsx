import Link from 'next/link'

import { FeatureFlag } from '../dev-utils/feature-flag'
import { Button } from '../ui/button'
import { NavButton } from './nav-button'

export function App({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-x-hidden">
      {/* header */}
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-6 bg-background px-3 backdrop-blur-sm">
        <Button variant="link" className="font-mono" asChild>
          <Link href="/">ORCHID</Link>
        </Button>

        <nav className="flex grow items-center gap-2 text-sm font-medium">
          <NavButton href="/models">Models</NavButton>
          <NavButton href="/changes">Changes</NavButton>

          <FeatureFlag flag="dev">
            <div className="ml-auto flex gap-2 font-mono">
              <NavButton href="/dev/components" className="border border-dashed">
                Components
              </NavButton>

              <NavButton href="/dev/changes" className="border border-dashed">
                Changes
              </NavButton>

              <div className="flex flex-col justify-center rounded border border-dashed px-1 font-mono text-xs text-muted-foreground">
                <div className="flex gap-1">
                  models
                  <a
                    className="underline decoration-dashed underline-offset-1"
                    href="https://openrouter.ai/api/v1/models"
                  >
                    V1
                  </a>
                  <a
                    className="underline decoration-dashed underline-offset-1"
                    href="https://openrouter.ai/api/frontend/models"
                  >
                    FE
                  </a>
                </div>
                <div className="flex gap-1">
                  providers
                  <a
                    className="underline decoration-dashed underline-offset-1"
                    href="https://openrouter.ai/api/frontend/all-providers"
                  >
                    FE
                  </a>
                </div>
              </div>
            </div>
          </FeatureFlag>
        </nav>
      </header>

      {/* body */}
      {children}
    </div>
  )
}
