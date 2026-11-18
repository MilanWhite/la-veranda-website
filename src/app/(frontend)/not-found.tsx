import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false },
}

export default function NotFound() {
  return (
    <section className="section status-page">
      <div className="container narrow center">
        <p className="eyebrow eyebrow-accent">404</p>
        <h1>Page Not Found</h1>
        <p className="lead">
          Sorry, we couldn’t find that page. It may have moved when our website was updated.
        </p>
        <div className="button-row button-row-center">
          <Link href="/" className="button-solid">
            Home
          </Link>
          <Link href="/menu" className="button">
            Our Menu
          </Link>
          <Link href="/events" className="button">
            Events
          </Link>
          <Link href="/contact" className="button">
            Contact
          </Link>
        </div>
      </div>
    </section>
  )
}
