'use client'

import * as React from 'react'

import { Moon, Sun, SunMoon } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'

export function ThemeButton() {
  const [isMounted, setIsMounted] = React.useState(false)
  const { theme, setTheme } = useTheme()

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const cycleTheme = () => {
    switch (theme) {
      case 'light':
        setTheme('dark')
        break
      case 'dark':
        setTheme('system')
        break
      default:
        setTheme('light')
        break
    }
  }

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-[1.2rem] w-[1.2rem]" />
      case 'dark':
        return <Moon className="h-[1.2rem] w-[1.2rem]" />
      default:
        return <SunMoon className="h-[1.2rem] w-[1.2rem]" />
    }
  }

  return (
    <Button variant="ghost" size="icon" className="rounded-xl" onClick={cycleTheme}>
      {isMounted && getIcon()}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
