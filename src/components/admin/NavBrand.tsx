import Link from 'next/link'

import logoDark from '@/assets/logo-dark.png'
import { KeepNavOpen } from './KeepNavOpen'

// Top of the admin sidebar: the La Veranda logo and a "Dashboard" link, so getting back home
// is always one obvious click.
export function NavBrand() {
  return (
    <div className="lv-brand">
      <KeepNavOpen />
      <Link href="/admin" className="lv-brand-logo" aria-label="La Veranda dashboard">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoDark.src} alt="La Veranda" />
      </Link>
      <Link href="/admin" className="lv-brand-home">
        Dashboard
      </Link>
    </div>
  )
}
