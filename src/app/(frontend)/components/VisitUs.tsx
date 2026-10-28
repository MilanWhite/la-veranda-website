import Link from 'next/link'

import type { SiteSetting } from '@/payload-types'
import { ContactList } from './ContactList'
import { HoursList } from './HoursList'
import { directionsUrl, MapEmbed } from './MapEmbed'
import { SocialLinks } from './SocialLinks'

// "Visit Us": contact details + map on the left, opening hours + buttons on the right.
// Used on the homepage and the Contact page.
export function VisitUs({
  settings,
  title = 'Visit Us',
  alt = true,
  showSocial = false,
}: {
  settings: SiteSetting
  title?: string
  alt?: boolean
  showSocial?: boolean
}) {
  const directions = directionsUrl(settings)
  const hasHours = Boolean(settings.hours?.length)
  const hasSocial = showSocial && Boolean(settings.socialLinks?.length)

  return (
    <section className={alt ? 'section section-alt' : 'section'}>
      <div className="container">
        <h2 className="section-title">{title}</h2>
        <hr className="divider" />
        <div className="visit-grid">
          <div className="visit-col">
            <p className="eyebrow eyebrow-accent">Find Us</p>
            <ContactList settings={settings} />
            <MapEmbed settings={settings} />
          </div>

          <div className="visit-col">
            {hasHours && (
              <>
                <p className="eyebrow eyebrow-accent">Opening Hours</p>
                <HoursList hours={settings.hours} />
              </>
            )}
            {hasSocial && (
              <>
                <p className="eyebrow eyebrow-accent">Follow Us</p>
                <SocialLinks links={settings.socialLinks} className="social-icons visit-social" />
              </>
            )}
            <div className="button-row">
              {directions && (
                <a href={directions} className="button" target="_blank" rel="noopener noreferrer">
                  Get Directions
                </a>
              )}
              <Link href="/events#book-an-event" className="button">
                Book an Event
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
