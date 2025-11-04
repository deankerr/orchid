'use client'

import { useEffect, useState } from 'react'

// presentational features only
export function FeatureFlag({ flag, children }: { flag: string; children: React.ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true)
    if (typeof window !== 'undefined' && window.localStorage) {
      const enabled = localStorage.getItem(`feature-${flag}`) === 'true'
      setIsEnabled(enabled)
    }
  }, [flag])

  // Prevent hydration mismatch
  if (!hasMounted) return null

  return isEnabled ? <>{children}</> : null
}

// Helper to toggle flags from dev tools or anywhere
export const toggleFeature = (flag: string) => {
  if (typeof window === 'undefined' || !window.localStorage) return
  const current = localStorage.getItem(`feature-${flag}`) === 'true'
  localStorage.setItem(`feature-${flag}`, (!current).toString())
  window.location.reload() // Quick reload to apply changes
}

// Helper to check if feature is enabled (for conditional logic)
export const isFeatureEnabled = (flag: string) => {
  if (typeof window === 'undefined' || !window.localStorage) return false
  return localStorage.getItem(`feature-${flag}`) === 'true'
}

// Make it globally available
if (typeof window !== 'undefined') {
  ;(window as any).toggleFeature = toggleFeature
  ;(window as any).isFeatureEnabled = isFeatureEnabled
}
