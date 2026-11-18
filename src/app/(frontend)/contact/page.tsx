import type { Metadata } from 'next'
import Link from 'next/link'

import contactBanner from '@/assets/contact-banner.webp'
import { ContactList } from '../components/ContactList'
import { HoursList } from '../components/HoursList'
import { directionsUrl, MapEmbed } from '../components/MapEmbed'
import { PageBanner } from '../components/PageBanner'
import { SocialLinks } from '../components/SocialLinks'
import { getSiteSettings } from '../getSiteSettings'
import { ContactForm } from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contact La Veranda at 140 Woodbridge Ave., Woodbridge, Ontario: send a message, call or email, see opening hours and get directions.',
}

export default async function ContactPage() {
  const settings = await getSiteSettings()
  const directions = directionsUrl(settings)

  return (
    <>
      <PageBanner title="Contact Us" image={contactBanner} />

      <section className="section">
        <div className="container contact-grid">
          <div>
            <p className="eyebrow eyebrow-accent">Get in touch</p>
            <h2>Let’s Talk</h2>
            <p className="lead">
              Have a question? Send us a message and we’ll get back to you. Planning an event?{' '}
              <Link href="/events#book-an-event">Send an event request</Link> instead.
            </p>
            <ContactForm />
          </div>

          <aside className="contact-aside">
            <p className="eyebrow eyebrow-accent">Contact Info</p>
            <ContactList settings={settings} />

            {settings.hours && settings.hours.length > 0 && (
              <>
                <p className="eyebrow eyebrow-accent">Opening Hours</p>
                <HoursList hours={settings.hours} />
              </>
            )}

            {settings.socialLinks && settings.socialLinks.length > 0 && (
              <>
                <p className="eyebrow eyebrow-accent">Follow Us</p>
                <SocialLinks links={settings.socialLinks} className="social-icons visit-social" />
              </>
            )}

            {directions && (
              <a href={directions} className="button" target="_blank" rel="noopener noreferrer">
                Get Directions
              </a>
            )}
          </aside>
        </div>
      </section>

      <MapEmbed settings={settings} className="map map-wide" />
    </>
  )
}
