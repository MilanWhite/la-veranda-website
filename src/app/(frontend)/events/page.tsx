import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { FaRegCheckCircle } from 'react-icons/fa'

import eventsBanner from '@/assets/events-banner.webp'
import { CtaSection } from '../components/CtaSection'
import { FormPlaceholder } from '../components/FormPlaceholder'
import { PageBanner } from '../components/PageBanner'
import { getSiteSettings } from '../getSiteSettings'
import { asMedia, getGallery, getMenu } from '../lib/content'

export const metadata: Metadata = {
  title: 'Events',
  description:
    'Weddings, showers, communions, corporate functions and birthdays at La Veranda, a historic event venue in Downtown Woodbridge with indoor and outdoor spaces. Request your event online.',
}

// From the old Events page. Will move to the event-menu data once the request form is built.
const eventTypes = [
  'Corporate Events',
  'Weddings',
  'Confirmations',
  'Engagements',
  'Communions',
  'Bridal Showers',
  'Sweet 16s',
  'Baptisms',
  'Birthdays',
  'And More',
]

export default async function EventsPage() {
  const [gallery, brunch, settings] = await Promise.all([
    getGallery(),
    getMenu('brunch'),
    getSiteSettings(),
  ])
  const photos = gallery.filter((g) => g.showOnEventsPage).map((g) => g.image)
  const groupMenu = asMedia(settings.groupMenuPdf)
  const brunchMenu = asMedia(brunch?.pdf)

  return (
    <>
      <PageBanner title="Events" image={eventsBanner} />

      <section className="section">
        <div className="container center">
          <p className="eyebrow eyebrow-accent">Events</p>
          <h2 className="section-title">Events Booking</h2>
          <div className="lead">
            <p>
              La Veranda, one of Woodbridge’s original and historic event venues, is being
              reimagined as the newest piece of Downtown Woodbridge. This landmark venue features
              both indoor and outdoor spaces and checks all the boxes for your wedding, bridal
              shower, baby shower, communion, corporate function, mitzvah, meeting and other events.
            </p>
            <p>Now booking all types of events.</p>
          </div>

          <hr className="divider" />

          <ul className="check-list">
            {eventTypes.map((type) => (
              <li key={type}>
                <FaRegCheckCircle aria-hidden /> {type}
              </li>
            ))}
          </ul>

          {(groupMenu?.url || brunchMenu?.url) && (
            <div className="button-row button-row-center">
              {groupMenu?.url && (
                <a
                  href={groupMenu.url}
                  className="button"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download Group Menu
                </a>
              )}
              {brunchMenu?.url && (
                <a
                  href={brunchMenu.url}
                  className="button"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download Brunch Menu
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      <section id="book-an-event" className="section section-alt anchor-target">
        <div className="container narrow">
          <h2 className="section-title">Event Contract</h2>
          <p className="lead center">
            Fill in your event details. You’ll receive a quotation by email before any payment is
            required. Sending a request does not confirm your booking.
          </p>

          {/* Placeholder: the online event request form (customer details, date and time,
              guests, menu selections, extras, notes) is built in Stages 8–10. */}
          <FormPlaceholder
            id="event-request-form"
            title="Online event request form"
            settings={settings}
          >
            <p>
              Our online event request form is on its way. Until then, contact us with the date,
              start and end time, type of event and number of guests (adults and kids), and we’ll
              reply with a quotation.
            </p>
          </FormPlaceholder>
        </div>
      </section>

      {photos.length > 0 && (
        <section className="section">
          <div className="container">
            <h2 className="section-title">Our Events</h2>
            <hr className="divider" />
            <ul className="photo-grid">
              {photos.map((photo) => (
                <li key={photo.id}>
                  <Image
                    src={photo.url!}
                    alt={photo.alt}
                    width={photo.width ?? 1200}
                    height={photo.height ?? 800}
                    sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 400px"
                  />
                </li>
              ))}
            </ul>
            <p className="center">
              <Link href="/gallery" className="button">
                View Gallery
              </Link>
            </p>
          </div>
        </section>
      )}

      <CtaSection
        photo
        title="Book Your Event"
        actions={[{ label: 'Request an Event', href: '#book-an-event', solid: true }]}
      >
        <p>
          Here you will find the ultimate space for any special event, whether it’s a wedding, a
          corporate meeting or party, a bridal shower, a special occasion or an intimate gathering.
          La Veranda is completely transformable to make your event unique and unforgettable.
        </p>
      </CtaSection>
    </>
  )
}
