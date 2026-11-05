import type { Metadata } from 'next'

import reservationsBanner from '@/assets/reservations-banner.webp'
import { CtaSection } from '../components/CtaSection'
import { HoursList } from '../components/HoursList'
import { PageBanner } from '../components/PageBanner'
import { getSiteSettings } from '../getSiteSettings'

export const metadata: Metadata = {
  title: 'Reservations',
  description: 'Reserve a table at La Veranda in Woodbridge by phone or email.',
}

// Table reservations are taken by phone/email only (not online). Private events go to
// the request form on /events instead.
export default async function ReservationsPage() {
  const settings = await getSiteSettings()

  return (
    <>
      <PageBanner title="Reservations" image={reservationsBanner} />

      <section className="section">
        <div className="container reservation-grid">
          <div>
            <h2>Book Your Reservation</h2>
            <p className="lead">
              Indulge in a delightful dining experience where exquisite flavours meet a charming
              ambiance. Whether it’s a romantic dinner, a family gathering or a special celebration,
              we’ll make your visit unforgettable.
            </p>
            <p>To reserve a table, call us or send us an email with:</p>
            <ul className="plain-list">
              <li>Your name and phone number</li>
              <li>The date and time you’d like</li>
              <li>The number of guests</li>
            </ul>
            <div className="button-row">
              {settings.phone && (
                <a href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`} className="button-solid">
                  Call {settings.phone}
                </a>
              )}
              {settings.email && (
                <a
                  href={`mailto:${settings.email}?subject=${encodeURIComponent('Table reservation')}`}
                  className="button"
                >
                  Email Us
                </a>
              )}
            </div>
          </div>

          {settings.hours && settings.hours.length > 0 && (
            <aside>
              <p className="eyebrow eyebrow-accent">Opening Hours</p>
              <HoursList hours={settings.hours} />
            </aside>
          )}
        </div>
      </section>

      <CtaSection
        title="Planning a Private Event?"
        actions={[
          { label: 'Book an Event', href: '/events#book-an-event' },
          { label: 'Our Events', href: '/events' },
        ]}
      >
        <p>
          For weddings, showers, communions, corporate functions, birthdays and other private
          events, send us an event request instead.
        </p>
      </CtaSection>
    </>
  )
}
