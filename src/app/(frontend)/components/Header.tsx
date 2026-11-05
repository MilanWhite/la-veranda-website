import Image from 'next/image'
import Link from 'next/link'
import { FaBars, FaCaretDown, FaEnvelope, FaPhoneAlt } from 'react-icons/fa'

import logo from '@/assets/logo.png'
import { getSiteSettings } from '../getSiteSettings'
import { NavAutoClose } from './NavAutoClose'
import { SocialLinks } from './SocialLinks'

const nav = [
  { label: 'Home', href: '/' },
  {
    label: 'Menu',
    children: [
      { label: 'Dinner Menu', href: '/menu' },
      { label: 'Brunch Menu', href: '/brunch-menu' },
    ],
  },
  {
    label: 'Events',
    children: [
      { label: 'Events', href: '/events' },
      { label: 'Weddings & Corporate', href: '/weddings-corporate' },
    ],
  },
  { label: 'Specials', href: '/specials' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Contact', href: '/contact' },
]

export async function Header() {
  const settings = await getSiteSettings()

  return (
    <header className="header">
      <div className="topbar">
        <div className="container-wide topbar-inner">
          <div className="topbar-contact">
            {settings.email && (
              <a href={`mailto:${settings.email}`}>
                <FaEnvelope /> {settings.email}
              </a>
            )}
            {settings.phone && (
              <a href={`tel:${settings.phone}`}>
                <FaPhoneAlt /> {settings.phone}
              </a>
            )}
          </div>
          <SocialLinks links={settings.socialLinks} className="topbar-social" />
        </div>
      </div>

      <div className="container-wide navbar">
        <Link href="/">
          <Image
            src={logo}
            alt={settings.restaurantName}
            width={160}
            className="logo"
            style={{ height: 'auto' }}
            priority
          />
        </Link>

        <input type="checkbox" id="nav-toggle" className="nav-toggle" />
        <label htmlFor="nav-toggle" className="nav-toggle-label" aria-label="Menu">
          <FaBars />
        </label>

        <nav className="nav">
          <ul>
            {nav.map((item) =>
              item.children ? (
                <li key={item.label} className="has-dropdown">
                  <button type="button">
                    {item.label} <FaCaretDown />
                  </button>
                  <ul className="dropdown">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link href={child.href}>{child.label}</Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ),
            )}
          </ul>
          <Link href="/events#book-an-event" className="button">
            Book an Event
          </Link>
        </nav>
        <NavAutoClose />
      </div>
    </header>
  )
}
