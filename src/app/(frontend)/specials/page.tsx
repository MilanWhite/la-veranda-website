import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { FaRegClock } from 'react-icons/fa'

import specialsBanner from '@/assets/specials-banner.webp'
import { CtaSection } from '../components/CtaSection'
import { PageBanner } from '../components/PageBanner'
import { SocialLinks } from '../components/SocialLinks'
import { getSiteSettings } from '../getSiteSettings'
import { describeRepeat, TIME_ZONE } from '@/lib/recurrence'
import { asMedia, getActiveSpecials } from '../lib/content'

export const metadata: Metadata = {
  alternates: { canonical: '/specials' },
  title: 'Specials',
  description: 'Holiday brunches, special menus and upcoming events at La Veranda in Woodbridge.',
}

// Repeating specials move to their next date on their own, so rebuild this page hourly.
export const revalidate = 3600

// "27 November" like the old site
const dayFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'long',
})
const timeFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
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
                const repeat = describeRepeat(special.repeat)
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
                      {/* One line, e.g. "Last Friday of every month · 27 November" */}
                      {special.next && (
                        <p className="card-meta">
                          <FaRegClock aria-hidden />
                          {repeat && `${repeat} · `}
                          <time dateTime={special.next.toISOString()}>
                            {dayFormat.format(special.next)}
                            {special.showTime !== false && `, ${timeFormat.format(special.next)}`}
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
        title="Book Your Table"
        actions={[
          { label: 'Reserve a Table', href: '/reservations' },
          { label: 'Book an Event', href: '/events#book-an-event' },
        ]}
      >
        <p>
          Valentine’s Day, Easter, Christmas or New Year’s Eve: book your table and celebrate with
          gourmet flavours in a charming setting.
        </p>
      </CtaSection>
    </>
  )
}
