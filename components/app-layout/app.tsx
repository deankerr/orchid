import Link from 'next/link'

import { Button } from '../ui/button'
import { TooltipProvider } from '../ui/tooltip'
import { AdminMenu } from './admin-menu'
import { NavButton } from './nav-button'

export function App({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col overflow-x-hidden">
        {/* header */}
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-6 bg-background px-3">
          <Button variant="link" className="font-mono" asChild>
            <Link href="/">ORCHID</Link>
          </Button>

          <nav className="flex grow items-center gap-2 text-sm font-medium">
            <NavButton href="/endpoints">Endpoints</NavButton>
            <NavButton href="/changes">Changes</NavButton>

            <div className="ml-auto">
              <AdminMenu />
            </div>
          </nav>
        </header>

        {/* body */}
        {children}
      </div>
    </TooltipProvider>
  )
}
