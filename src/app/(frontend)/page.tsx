import Image from 'next/image'
import Link from 'next/link'

import eventCenter from '@/assets/event-center.webp'
import hero from '@/assets/hero.webp'
import kitchen from '@/assets/kitchen.webp'
import statement from '@/assets/statement.jpg'
import { ContactList } from './components/ContactList'
import { getSiteSettings } from './getSiteSettings'

// Temporary: replaced by menu data in Stage 6.
const dishes = {
  'Popular Dishes': [
    { name: 'Pepperoni Pizza', description: 'Tomato sauce, cheese and pepperoni', price: 16 },
    {
      name: 'La Veranda Pizza',
      description: 'Bocconcini, cherry tomato, prosciutto, arugula, Grana Padano, red or white',
      price: 22,
    },
    {
      name: 'La Veranda Porchetta',
      description:
        'Slow roasted pork shoulder / house baked focaccia / caramelized onions / rapini / roasted garlic aioli',
      price: 16,
    },
    {
      name: 'Polipo Alla Griglia',
      description: 'Grilled octopus / balsamic reduction / chickpea / arugula',
      price: 26,
    },
  ],
  'Our Recommendation': [
    { name: 'Hummus', description: 'Chickpea, roasted garlic, smoked paprika and lemon', price: 6 },
    {
      name: 'Grilled Organic Salmon Filet',
      description: 'Wilted kale and mixed mushroom salad, warm pancetta – truffle dressing',
      price: 24,
    },
    {
      name: 'Spigola',
      description:
        'Grilled whole European sea bass / stewed fregola / leeks / rapini / cauliflower / clams',
      price: 32,
    },
    {
      name: 'Gnocchi E Ragu Di Agnello',
      description: 'Potato gnocchi / stewed lamb and tomato',
      price: 20,
    },
  ],
}

export default async function HomePage() {
  const settings = await getSiteSettings()
  const mapQuery = settings.address && encodeURIComponent(settings.address.replace(/\s+/g, ' '))

  return (
    <>
      <section className="hero">
        <Image src={hero} alt="" fill priority sizes="100vw" className="cover darken" />
        <div className="container hero-content">
          <p className="eyebrow">Impress your guests.</p>
          <h1>
            Downtown Woodbridge’s Premier Event Space For All Corporate, Social And Private Events.
          </h1>
          <Link href="/book-an-event" className="button-solid">
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
            <Link href="/book-an-event" className="button">
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

      <section className="section section-alt">
        <div className="container">
          <h2 className="section-title">Our Menu</h2>
          <hr className="divider" />
          <div className="dish-grid">
            {Object.entries(dishes).map(([heading, items]) => (
              <div key={heading}>
                <p className="eyebrow eyebrow-accent">{heading}</p>
                {items.map((dish) => (
                  <div key={dish.name} className="dish">
                    <div className="leader-row">
                      <h3>{dish.name}</h3>
                      <span className="leader-line" />
                      <span className="leader-value">${dish.price}</span>
                    </div>
                    <p>{dish.description}</p>
                  </div>
                ))}
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

      <section className="statement">
        <Image src={statement} alt="" fill sizes="100vw" className="cover" />
      </section>

      <section className="section section-alt">
        <div className="container">
          <h2 className="section-title">Visit Us</h2>
          <hr className="divider" />
          <div className="visit-grid">
            <div className="visit-col">
              <p className="eyebrow eyebrow-accent">Find Us</p>
              <ContactList settings={settings} />
              {mapQuery && (
                <iframe
                  className="map"
                  src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                  title={`Map of ${settings.restaurantName}`}
                  loading="lazy"
                />
              )}
            </div>

            <div className="visit-col">
              {settings.hours && settings.hours.length > 0 && (
                <>
                  <p className="eyebrow eyebrow-accent">Opening Hours</p>
                  <ul className="hours-list">
                    {settings.hours.map((h) => (
                      <li key={h.id}>
                        <div className="leader-row">
                          <h3>{h.days}</h3>
                          <span className="leader-line" />
                          <span className="leader-value">{h.time}</span>
                        </div>
                        {h.note && <p className="hours-note">{h.note}</p>}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <div className="button-row">
                {mapQuery && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`}
                    className="button"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get Directions
                  </a>
                )}
                <Link href="/book-an-event" className="button">
                  Book an Event
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
