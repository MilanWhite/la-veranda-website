import Image from 'next/image'
import Link from 'next/link'

import logo from '@/assets/logo.png'
import { getSiteSettings } from '../getSiteSettings'
import { ContactList } from './ContactList'
import { SocialLinks } from './SocialLinks'

const quickLinks = [
  { label: 'Home', href: '/' },
  { label: 'Events', href: '/events' },
  { label: 'Reservation', href: '/reservations' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Contract Form', href: '/events#book-an-event' },
  { label: 'Contact', href: '/contact' },
]

const menuLinks = [
  { label: 'Pasta', href: '/menu#pasta' },
  { label: 'Pizza', href: '/menu#pizza' },
  { label: 'Secondi', href: '/menu#secondi' },
  { label: 'Antipasto', href: '/menu#antipasto' },
  { label: 'Brunch', href: '/brunch-menu' },
]

export async function Footer() {
  const settings = await getSiteSettings()

  return (
    <footer className="footer">
      <div className="container-wide footer-grid">
        <div>
          <Image
            src={logo}
            alt={settings.restaurantName}
            width={160}
            className="logo"
            style={{ height: 'auto' }}
          />
          <p>
            At La Veranda Restaurant, we bring the flavors to your table with a menu inspired by
            Nonna’s kitchen, blending traditional classics with modern twists.
          </p>
          <SocialLinks links={settings.socialLinks} className="social-icons" />
        </div>

        <div>
          <h2>Quick Links</h2>
          <ul>
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2>Menu</h2>
          <ul>
            {menuLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2>Contact Info</h2>
          <ContactList settings={settings} />
        </div>
      </div>

      <div className="container-wide">
        <p className="copyright">
          © {new Date().getFullYear()} {settings.restaurantName} Restaurant
        </p>
      </div>
    </footer>
  )
}
