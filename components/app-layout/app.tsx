import Link from 'next/link'

import { FeatureFlag } from '../dev-utils/feature-flag'
import { Button } from '../ui/button'
import { NavButton } from './nav-button'

export function App({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-x-hidden">
      {/* header */}
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-6 bg-background px-3">
        <Button variant="link" className="font-mono" asChild>
          <Link href="/">ORCHID</Link>
        </Button>

        <nav className="flex grow items-center gap-2 text-sm font-medium">
          <NavButton href="/endpoints">Endpoints</NavButton>
          <NavButton href="/changes">Changes</NavButton>

          <FeatureFlag flag="dev">
            <div className="ml-auto flex gap-2 font-mono">
              <NavButton href="/dev/resources" className="border border-dashed">
                Resources
              </NavButton>

              <NavButton href="/dev/components" className="border border-dashed">
                Components
              </NavButton>

              <NavButton href="/dev/changes" className="border border-dashed">
                Changes
              </NavButton>
            </div>
          </FeatureFlag>
        </nav>
      </header>

      {/* body */}
      {children}
    </div>
  )
}
