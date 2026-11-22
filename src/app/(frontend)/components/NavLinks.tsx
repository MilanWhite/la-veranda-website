'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

// Header links that know which page is open: the current page's link gets
// aria-current="page" (styled in globals.css), and a dropdown's button is marked when one of
// its pages is open.

const isCurrent = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname()
  return (
    <Link href={href} aria-current={isCurrent(pathname, href) ? 'page' : undefined}>
      {children}
    </Link>
  )
}

export function NavGroupButton({ hrefs, children }: { hrefs: string[]; children: ReactNode }) {
  const pathname = usePathname()
  const current = hrefs.some((href) => isCurrent(pathname, href))
  return (
    <button type="button" className={current ? 'is-current' : undefined}>
      {children}
    </button>
  )
}
