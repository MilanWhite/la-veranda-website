'use client'

import { useEffect } from 'react'

const slug = (text: string) =>
  text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

// Lets a link open a specific tab: /admin/globals/event-menu#reply-templates opens the
// "Reply Templates" tab (Payload tabs have no address of their own). Renders nothing.
export function OpenTabFromHash() {
  useEffect(() => {
    let tries = 0
    let timer: ReturnType<typeof setTimeout>
    const open = () => {
      const wanted = window.location.hash.slice(1)
      if (!wanted) return
      const button = [
        ...document.querySelectorAll<HTMLButtonElement>('.tabs-field__tab-button'),
      ].find((b) => slug(b.textContent ?? '') === wanted)
      if (button) {
        button.click()
        button.scrollIntoView({ block: 'nearest' })
      } else if (tries++ < 20) {
        timer = setTimeout(open, 100) // the form may still be rendering
      }
    }
    open()
    window.addEventListener('hashchange', open)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('hashchange', open)
    }
  }, [])

  return null
}
