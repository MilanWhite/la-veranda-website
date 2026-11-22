'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

// The nav dropdowns open on hover/focus with CSS only. After clicking a link in one, the
// mouse is still over it and the link keeps focus, so it would stay open on the new page.
// So: after a page change that came from clicking a dropdown link, the dropdowns stay shut
// until the mouse moves off them (or a key is pressed). Any other page change clears that
// state, so quick clicking around can never leave the dropdowns stuck shut. The phone menu
// closes on every page change.
export function NavAutoClose() {
  const pathname = usePathname()
  const fromDropdown = useRef(false)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.('.nav .dropdown a')) fromDropdown.current = true
    }
    // Escape closes the phone menu
    const onKey = (e: KeyboardEvent) => {
      const toggle = document.getElementById('nav-toggle') as HTMLInputElement | null
      if (e.key === 'Escape' && toggle?.checked) toggle.checked = false
    }
    document.addEventListener('click', onClick, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('.nav')
    const toggle = document.getElementById('nav-toggle') as HTMLInputElement | null
    if (toggle) toggle.checked = false
    if (!nav) return

    const reopen = () => nav.classList.remove('nav-closed')
    reopen()
    if (!fromDropdown.current) return
    fromDropdown.current = false

    if (nav.contains(document.activeElement)) (document.activeElement as HTMLElement).blur()
    nav.classList.add('nav-closed')

    const onMove = (e: PointerEvent) => {
      if (!(e.target as Element | null)?.closest?.('.has-dropdown')) reopen()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('keydown', reopen)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('keydown', reopen)
      reopen()
    }
  }, [pathname])

  return null
}
