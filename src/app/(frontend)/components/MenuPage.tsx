import Link from 'next/link'
import { notFound } from 'next/navigation'

import menuBanner from '@/assets/menu-banner.webp'
import type { Menu } from '@/payload-types'
import { asMedia, getMenu } from '../lib/content'
import { CtaSection } from './CtaSection'
import { MenuSections } from './MenuSections'
import { PageBanner } from './PageBanner'

// Shared layout for /menu and /brunch-menu. Content comes from the "Menus" collection.
export async function MenuPage({
  slug,
  otherMenu,
}: {
  slug: Menu['slug']
  otherMenu: { label: string; href: string }
}) {
  const menu = await getMenu(slug)
  if (!menu) notFound()

  const pdf = asMedia(menu.pdf)

  return (
    <>
      <PageBanner title={menu.title} image={menuBanner} />

      <section className="section">
        <div className="container">
          <h2 className="section-title">{slug === 'brunch' ? 'Our Brunch Menu' : 'Our Menu'}</h2>
          {menu.intro && <p className="lead center">{menu.intro}</p>}

          <div className="button-row button-row-center">
            {pdf?.url ? (
              <a href={pdf.url} className="button" target="_blank" rel="noopener noreferrer">
                {menu.pdfLabel || 'Download Menu'}
              </a>
            ) : (
              // No PDF uploaded yet: keep the button in place so the layout is final, but
              // say so instead of linking nowhere. Uploading a PDF in the admin turns it on.
              <span className="button is-disabled" aria-disabled="true" title="PDF coming soon">
                {menu.pdfLabel || 'Download Menu'}
                <small>Coming soon</small>
              </span>
            )}
            <Link href={otherMenu.href} className="button">
              {otherMenu.label}
            </Link>
          </div>

          <hr className="divider" />
          <MenuSections sections={menu.sections} columns />
        </div>
      </section>

      <CtaSection
        photo
        title="Book Your Reservation"
        actions={[{ label: 'Reservations', href: '/reservations' }]}
      >
        <p>
          Indulge in a delightful dining experience where exquisite flavours meet a charming
          ambiance. Whether it’s a romantic dinner, a family gathering or a special celebration,
          reserve your table and let us make your visit unforgettable.
        </p>
      </CtaSection>
    </>
  )
}
