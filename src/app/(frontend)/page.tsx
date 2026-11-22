import type { Metadata } from 'next'
import Image, { getImageProps } from 'next/image'
import Link from 'next/link'

import eventCenter from '@/assets/event-center.webp'
import hero from '@/assets/hero.webp'
import kitchen from '@/assets/kitchen.webp'
import statement from '@/assets/statement.jpg'
import { MenuSections } from './components/MenuSections'
import { VisitUs } from './components/VisitUs'
import { getSiteSettings } from './getSiteSettings'
import { getMenu } from './lib/content'

export const metadata: Metadata = { alternates: { canonical: '/' } }

// Dinner-menu items marked "Show on homepage" in the admin, grouped like the old site.
async function getFeaturedDishes() {
  const menu = await getMenu('dinner')
  const items = (menu?.sections ?? []).flatMap((s) => s.items ?? [])
  const groups = [
    { id: 'popular', title: 'Popular Dishes' },
    { id: 'recommendation', title: 'Our Recommendation' },
  ] as const
  return groups
    .map((g) => ({
      id: g.id,
      title: g.title,
      items: items.filter((i) => i.featured === g.id && i.available !== false),
    }))
    .filter((g) => g.items.length > 0)
}

export default async function HomePage() {
  const [settings, featured] = await Promise.all([getSiteSettings(), getFeaturedDishes()])

  return (
    <>
      <section className="hero">
        <Image src={hero} alt="" fill priority sizes="100vw" className="cover darken" />
        <div className="container hero-content">
          <p className="eyebrow">Impress your guests.</p>
          <h1>
            Downtown Woodbridge’s Premier Event Space For All Corporate, Social And Private Events.
          </h1>
          <Link href="/events#book-an-event" className="button-solid">
            Book an Event
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="container feature-grid">
          <div className="feature">
            <Image src={eventCenter} alt="La Veranda event room" className="feature-image" />
            <h2>Event Center</h2>
            <p>
              From birthdays to weddings, we have done it all. Your next event is just a click away.
              Book with us today and all you have to do is sit back and enjoy. If you have any
              questions, don’t hesitate to contact us.
            </p>
            <Link href="/events#book-an-event" className="button">
              Book an Event
            </Link>
          </div>
          <div className="feature">
            <Image
              src={kitchen}
              alt="Plated dish from the La Veranda kitchen"
              className="feature-image"
            />
            <h2>From Our Kitchen</h2>
            <p>
              From Nonna’s kitchen to your table. Our menu of Italian classic dishes combined with
              some new flavours is waiting for you at La Veranda. Click below to browse our menu.
            </p>
            <Link href="/menu" className="button">
              View Our Menu
            </Link>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <h2 className="section-title">Our Menu</h2>
            <hr className="divider" />
            <div className="dish-grid">
              {featured.map((group) => (
                <div key={group.id}>
                  <MenuSections sections={[group]} />
                </div>
              ))}
            </div>
            <p className="center">
              <Link href="/menu" className="button">
                View Our Menu
              </Link>
            </p>
          </div>
        </section>
      )}

      {/* "Window" effect like the old site: the photo stays still while the page scrolls past */}
      <section
        className="statement"
        aria-hidden
        style={{
          backgroundImage: `url(${getImageProps({ src: statement, alt: '', width: 1920 }).props.src})`,
        }}
      />

      <VisitUs settings={settings} />
    </>
  )
}
