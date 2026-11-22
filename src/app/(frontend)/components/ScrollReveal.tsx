'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

import { REVEAL, type RevealKind } from '../lib/reveal'

const KINDS = Object.keys(REVEAL) as RevealKind[]

// Plays each part's entrance animation once, when it scrolls into view (see lib/reveal.ts).
// Parts that come into view together are staggered slightly, left to right / top to bottom.
// Watches for parts added later too (e.g. gallery photos after picking a filter).
export function ScrollReveal() {
  const pathname = usePathname()

  useEffect(() => {
    // Running: turns off the "show everything after 3 seconds" safety net (lib/reveal.ts)
    document.documentElement.classList.add('reveal-js')

    const show = new IntersectionObserver(
      (entries) => {
        let n = 0
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const el = entry.target as HTMLElement
          el.style.setProperty('--reveal-delay', `${Math.min(n++, 5) * 0.12}s`)
          el.classList.add('is-in')
          show.unobserve(el)
        }
      },
      // Starts once the part's top is a little way up from the bottom of the screen
      { rootMargin: '0px 0px -10% 0px' },
    )

    const watch = (root: Document | Element) => {
      for (const kind of KINDS) {
        const selector = REVEAL[kind].join(', ')
        const found = [...root.querySelectorAll<HTMLElement>(selector)]
        if (root instanceof HTMLElement && root.matches(selector)) found.push(root)
        for (const el of found) {
          if (el.classList.contains('is-in')) continue
          el.dataset.reveal = kind
          show.observe(el)
        }
      }
    }
    watch(document)

    const added = new MutationObserver((records) => {
      for (const r of records) r.addedNodes.forEach((n) => n instanceof Element && watch(n))
    })
    const main = document.querySelector('main')
    if (main) added.observe(main, { childList: true, subtree: true })

    return () => {
      show.disconnect()
      added.disconnect()
    }
  }, [pathname])

  return null
}
