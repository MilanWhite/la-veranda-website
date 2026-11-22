import type { Metadata } from 'next'

import galleryBanner from '@/assets/gallery-banner.webp'
import galleryCta from '@/assets/gallery-cta.webp'
import { CtaSection } from '../components/CtaSection'
import { GalleryGrid } from '../components/GalleryGrid'
import { PageBanner } from '../components/PageBanner'
import { getGallery } from '../lib/content'

export const metadata: Metadata = {
  alternates: { canonical: '/gallery' },
  title: 'Gallery',
  description: 'Photos of the food, dining room and events at La Veranda in Woodbridge.',
}

export default async function GalleryPage() {
  const gallery = await getGallery()
  const images = gallery.flatMap(({ image, category }) =>
    image.url && image.width && image.height
      ? [{ url: image.url, alt: image.alt, width: image.width, height: image.height, category }]
      : [],
  )

  return (
    <>
      <PageBanner title="Gallery" image={galleryBanner} />
      <section className="section">
        {/* Full width like the old gallery, with the header's side margins */}
        <div className="container-wide">
          {images.length > 0 ? (
            <GalleryGrid images={images} />
          ) : (
            <p className="center">Photos are coming soon.</p>
          )}
        </div>
      </section>
      <CtaSection
        photo={galleryCta}
        title="Book Your Event"
        actions={[
          { label: 'Book an Event', href: '/events#book-an-event' },
          { label: 'Reserve a Table', href: '/reservations' },
        ]}
      >
        <p>
          From birthdays to weddings, we have done it all. Your next event is just a click away.
        </p>
      </CtaSection>
    </>
  )
}
