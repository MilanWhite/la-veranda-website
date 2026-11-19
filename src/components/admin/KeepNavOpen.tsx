'use client'

import { useNav } from '@payloadcms/ui'
import { useEffect } from 'react'

// The sidebar's collapse button is hidden on desktop, so the sidebar must always be open
// there, including for someone who collapsed it before (Payload remembers that). Phones keep
// Payload's own open/close menu.
const DESKTOP = '(min-width: 1025px)'

export function KeepNavOpen() {
  const { navOpen, setNavOpen } = useNav()

  useEffect(() => {
    const query = window.matchMedia(DESKTOP)
    const open = () => {
      if (query.matches && !navOpen) setNavOpen(true)
    }
    open()
    query.addEventListener('change', open)
    return () => query.removeEventListener('change', open)
  }, [navOpen, setNavOpen])

  return null
}
