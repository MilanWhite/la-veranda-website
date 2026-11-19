import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { FaRegCheckCircle } from 'react-icons/fa'

import eventsBanner from '@/assets/events-banner.webp'
import weddingsBanner from '@/assets/weddings-banner.webp'
import { CtaSection } from '../components/CtaSection'
import { startTimes } from '@/lib/eventRequests/validate'
import { FormPlaceholder } from '../components/FormPlaceholder'
import { PageBanner } from '../components/PageBanner'
import { PhotoCarousel } from '../components/PhotoCarousel'
import { getSiteSettings } from '../getSiteSettings'
import { asMedia, getEventMenu, getGallery, getMenu } from '../lib/content'
import { EventRequestForm } from './EventRequestForm'

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
  const [gallery, brunch, settings, eventMenu] = await Promise.all([
    getGallery(),
    getMenu('brunch'),
    getSiteSettings(),
    getEventMenu(),
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

      <section className="section section-alt">
        <div className="container feature-row">
          <Image
            src={weddingsBanner}
            alt="La Veranda's event room decorated with greenery and a chandelier"
            className="feature-row-image"
            sizes="(max-width: 900px) 100vw, 50vw"
          />
          <div className="feature-row-text">
            <p className="eyebrow eyebrow-accent">Weddings & Corporate</p>
            <h2>Planning a Wedding or Corporate Event?</h2>
            <p>
              From engagement parties and bridal showers to full wedding receptions and corporate
              functions, see how La Veranda can host your biggest days.
            </p>
            <Link href="/weddings-corporate" className="button">
              Weddings & Corporate Events
            </Link>
          </div>
        </div>
      </section>

      <section id="book-an-event" className="section anchor-target">
        <div className="container form-container">
          <h2 className="section-title">Event Contract</h2>
          <p className="lead center">
            Fill in your event details. You’ll receive a quotation by email before any payment is
            required. Sending a request does not confirm your booking.
          </p>

          {eventMenu.adultPrice != null ? (
            <EventRequestForm menu={eventMenu} startTimes={startTimes(eventMenu)} />
          ) : (
            <FormPlaceholder
              id="event-request-form"
              title="Online event request form"
              settings={settings}
            >
              <p>Online event requests are not available right now. Please email or call us.</p>
            </FormPlaceholder>
          )}
        </div>
      </section>

      {photos.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <h2 className="section-title">Our Events</h2>
            <hr className="divider" />
            <PhotoCarousel
              label="Photos from our events"
              photos={photos.flatMap((p) => (p.url ? [{ id: p.id, url: p.url, alt: p.alt }] : []))}
            />
            <p className="center">
              <Link href="/gallery" className="button">
                View Gallery
              </Link>
            </p>
          </div>
        </section>
      )}

      <CtaSection
        title="Book Your Event"
        actions={[
          { label: 'Book an Event', href: '#book-an-event' },
          { label: 'Weddings & Corporate', href: '/weddings-corporate' },
        ]}
      >
        <p>
          Weddings, corporate parties, bridal showers or an intimate gathering: La Veranda
          transforms to make your event unique and unforgettable.
        </p>
      </CtaSection>
    </>
  )
}
