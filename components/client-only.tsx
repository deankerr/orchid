'use client'

import { useEffect, useState, type ReactNode } from 'react'

export function ClientOnly({ children }: { children: ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true)
  }, [])

  if (!hasMounted) return null

  return children
}
