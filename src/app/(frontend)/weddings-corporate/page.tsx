import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { FaDoorOpen, FaGlassCheers, FaLeaf, FaUtensils } from 'react-icons/fa'

import corporateBuffet from '@/assets/corporate-buffet.webp'
import courseMain from '@/assets/course-main.webp'
import coursePasta from '@/assets/course-pasta.webp'
import courseStarters from '@/assets/course-starters.webp'
import weddingsBanner from '@/assets/weddings-room-banner.webp'
import weddingsCelebration from '@/assets/weddings-celebration.webp'
import { CtaSection } from '../components/CtaSection'
import { PageBanner } from '../components/PageBanner'
import { PhotoCarousel } from '../components/PhotoCarousel'
import { getSiteSettings } from '../getSiteSettings'
import { asMedia, getGallery } from '../lib/content'

export const metadata: Metadata = {
  alternates: { canonical: '/weddings-corporate' },
  title: 'Weddings & Corporate Events',
  description:
    'Wedding receptions, engagement parties, showers and corporate events at La Veranda, a historic event venue in Downtown Woodbridge with indoor and outdoor spaces and plated dinners from our kitchen.',
}

// Everything on this page comes from what La Veranda already publishes (old website and the
// event Group Menu PDF). Capacity, décor, entertainment and pricing details still need the
// owner's confirmation. No prices are repeated here: they
// live in the Group Menu (and later in the event-menu data).

const highlights = [
  {
    icon: FaDoorOpen,
    title: 'Indoor & Outdoor Spaces',
    text: 'A landmark venue in Downtown Woodbridge, completely transformable to suit your celebration.',
  },
  {
    icon: FaUtensils,
    title: 'Plated Dinners from Our Kitchen',
    text: 'A three-course plated dinner inspired by Nonna’s kitchen, with buffet-style stations available.',
  },
  {
    icon: FaGlassCheers,
    title: 'Open Bar Available',
    text: 'Add an open bar for your guests, or choose to pay per consumption. Soft drinks and coffee are included.',
  },
  {
    icon: FaLeaf,
    title: 'Every Guest Taken Care Of',
    text: 'Vegetarian options available, vegan and gluten-free on request, and a kids’ menu for the little ones.',
  },
]

const menuCourses = [
  {
    step: 'To start',
    course: 'Starters',
    detail: 'Four starters of your choice, served family style.',
    image: courseStarters,
    alt: 'Platter of fried calamari with dipping sauces and lemon',
  },
  {
    step: 'Then',
    course: 'Pasta',
    detail: 'Penne with your choice of sauce, or ask about risotto.',
    image: coursePasta,
    alt: 'Squid ink spaghetti with scallops and crab',
  },
  {
    step: 'Finally',
    course: 'Main',
    detail: 'Chicken, steak, veal, salmon, surf and turf and more.',
    image: courseMain,
    alt: 'Grilled meat with arugula and cherry tomatoes on a wooden board',
  },
]

const otherOccasions = ['Communions', 'Confirmations', 'Baptisms', 'Sweet 16s', 'Birthdays']

export default async function WeddingsCorporatePage() {
  const [settings, gallery] = await Promise.all([getSiteSettings(), getGallery()])
  const groupMenu = asMedia(settings.groupMenuPdf)
  const photos = gallery.filter((g) => g.category === 'events').slice(0, 6)

  return (
    <>
      <PageBanner
        title="Weddings & Corporate Events"
        eyebrow="Celebrate at La Veranda"
        image={weddingsBanner}
      />

      {/* Intro */}
      <section className="section">
        <div className="container narrow center">
          <p className="eyebrow eyebrow-accent">Downtown Woodbridge’s Event Venue</p>
          <h2 className="section-title">The Perfect Setting for Your Biggest Days</h2>
          <div className="lead">
            <p>
              La Veranda is one of Woodbridge’s original and historic event venues, reimagined as
              the newest piece of Downtown Woodbridge. With indoor and outdoor spaces, a kitchen
              inspired by Nonna’s cooking and a team that has hosted everything from birthdays to
              weddings, we bring your vision to life so you can simply enjoy the day.
            </p>
          </div>
          <div className="button-row button-row-center">
            <Link href="/events#book-an-event" className="button-solid">
              Request a Quote
            </Link>
            {groupMenu?.url && (
              <a href={groupMenu.url} className="button" target="_blank" rel="noopener noreferrer">
                Download Group Menu
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Weddings */}
      <section className="section section-alt">
        <div className="container feature-row">
          <Image
            src={weddingsCelebration}
            alt="Guests celebrating on the dance floor at La Veranda"
            className="feature-row-image"
            sizes="(max-width: 900px) 100vw, 50vw"
          />
          <div className="feature-row-text">
            <p className="eyebrow eyebrow-accent">Weddings</p>
            <h2>Your Wedding, Your Way</h2>
            <p>
              From an intimate engagement party to a full wedding reception, La Veranda is
              completely transformable to make your celebration unique and unforgettable. Choose
              your menu, set the mood, and let our team take care of the rest while you celebrate
              with the people you love.
            </p>
            <Link href="/events#book-an-event" className="button">
              Plan Your Wedding
            </Link>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Why Celebrate with Us</h2>
          <hr className="divider" />
          <ul className="highlight-grid">
            {highlights.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <Icon aria-hidden className="highlight-icon" />
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Menu overview */}
      <section className="section section-alt">
        <div className="container center">
          <p className="eyebrow eyebrow-accent">Standard Three-Course Plated Dinner</p>
          <h2 className="section-title">Your Event Menu</h2>
          {/* The three courses in order, styled like the Specials cards */}
          <ol className="course-list">
            {menuCourses.map((c) => (
              <li key={c.course}>
                <Image
                  src={c.image}
                  alt={c.alt}
                  className="course-image"
                  sizes="(max-width: 700px) 100vw, 340px"
                />
                <p className="course-step">{c.step}</p>
                <h3>{c.course}</h3>
                <p>{c.detail}</p>
              </li>
            ))}
          </ol>
          <p className="small">
            Served with a mixed green salad, soft drinks and coffee. Kids’ menu, open bar and
            buffet-style stations available. See the Group Menu for all choices and current pricing.
          </p>
          {groupMenu?.url && (
            <div className="button-row button-row-center">
              <a href={groupMenu.url} className="button" target="_blank" rel="noopener noreferrer">
                Download Group Menu
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Corporate */}
      <section className="section">
        <div className="container feature-row feature-row-reverse">
          <Image
            src={corporateBuffet}
            alt="Buffet of antipasto platters being served at a La Veranda event"
            className="feature-row-image"
            sizes="(max-width: 900px) 100vw, 50vw"
          />
          <div className="feature-row-text">
            <p className="eyebrow eyebrow-accent">Corporate</p>
            <h2>Meetings, Parties & Corporate Functions</h2>
            <p>
              Host your team, clients or partners somewhere memorable. Whether it’s a corporate
              meeting, a company party or a celebration of a big milestone, we set up the room and
              the menu around your event, so all you have to do is show up.
            </p>
            <Link href="/events#book-an-event" className="button">
              Plan a Corporate Event
            </Link>
          </div>
        </div>
      </section>

      {/* Photos (shaded, so the plain and shaded sections keep alternating) */}
      {photos.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <h2 className="section-title">Moments at La Veranda</h2>
            <hr className="divider" />
            <PhotoCarousel
              label="Photos from weddings and events"
              photos={photos.flatMap(({ image }) =>
                image.url ? [{ id: image.id, url: image.url, alt: image.alt }] : [],
              )}
            />
            <p className="center">
              <Link href="/gallery" className="button">
                View Gallery
              </Link>
            </p>
            <p className="center small">
              We also host {otherOccasions.slice(0, -1).join(', ').toLowerCase()} and{' '}
              {otherOccasions.at(-1)?.toLowerCase()}. <Link href="/events">See all events</Link>.
            </p>
          </div>
        </section>
      )}

      <CtaSection
        title="Let’s Plan Your Celebration"
        actions={[
          { label: 'Book an Event', href: '/events#book-an-event' },
          settings.phone
            ? {
                label: `Call ${settings.phone}`,
                href: `tel:${settings.phone.replace(/[^\d+]/g, '')}`,
              }
            : undefined,
        ]}
      >
        <p>
          Tell us about your day and we’ll send you a quotation by email. No payment is required
          until you’re ready.
        </p>
      </CtaSection>
    </>
  )
}
