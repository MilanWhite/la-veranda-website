import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { FaRegClock } from 'react-icons/fa'

import specialsBanner from '@/assets/specials-banner.webp'
import { CtaSection } from '../components/CtaSection'
import { PageBanner } from '../components/PageBanner'
import { SocialLinks } from '../components/SocialLinks'
import { getSiteSettings } from '../getSiteSettings'
import { asMedia, getActiveSpecials } from '../lib/content'

export const metadata: Metadata = {
  title: 'Specials',
  description: 'Holiday brunches, special menus and upcoming events at La Veranda in Woodbridge.',
}

const dateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Toronto',
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

export default async function SpecialsPage() {
  const [specials, settings] = await Promise.all([getActiveSpecials(), getSiteSettings()])

  return (
    <>
      <PageBanner title="Specials" image={specialsBanner} />

      <section className="section">
        <div className="container">
          <h2 className="section-title">Upcoming Special Events</h2>
          <hr className="divider" />

          {specials.length > 0 ? (
            <ul className="card-grid">
              {specials.map((special) => {
                const image = asMedia(special.image)
                return (
                  <li key={special.id} className="card">
                    {image?.url && (
                      <Image
                        src={image.url}
                        alt={image.alt}
                        width={image.width ?? 800}
                        height={image.height ?? 600}
                        className="card-image"
                        sizes="(max-width: 700px) 100vw, 380px"
                      />
                    )}
                    <div className="card-body">
                      <h3>{special.title}</h3>
                      {special.date && (
                        <p className="card-meta">
                          <FaRegClock aria-hidden />{' '}
                          <time dateTime={special.date}>
                            {dateFormat.format(new Date(special.date))}
                          </time>
                        </p>
                      )}
                      {special.description && <p>{special.description}</p>}
                      {special.cta?.label && special.cta.url && (
                        <Link href={special.cta.url} className="button">
                          {special.cta.label}
                        </Link>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="empty-state">
              <p>
                There are no special events scheduled right now. Follow us for holiday brunches,
                special menus and upcoming events.
              </p>
              <SocialLinks links={settings.socialLinks} className="social-icons" />
            </div>
          )}
        </div>
      </section>

      <CtaSection
        photo
        title="Book Your Table"
        actions={[
          { label: 'Reservations', href: '/reservations' },
          { label: 'Book an Event', href: '/events#book-an-event' },
        ]}
      >
        <p>
          Make every celebration memorable! Whether it’s Valentine’s Day, Easter, Christmas or New
          Year’s Eve, book your table and enjoy a spectacular dining experience with gourmet
          flavours and a charming ambiance.
        </p>
      </CtaSection>
    </>
  )
}
