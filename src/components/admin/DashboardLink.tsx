'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// "Dashboard" in the sidebar: styled like the other sidebar links (nav__link), and bold with
// the small marker only while the dashboard is open, the way they are.
export function DashboardLink() {
  const active = usePathname() === '/admin'
  return (
    <Link href="/admin" className={`nav__link lv-brand-home${active ? ' active' : ''}`}>
      {active && <span className="nav__link-indicator" />}
      Dashboard
    </Link>
  )
}
