import Image, { type StaticImageData } from 'next/image'

// Dark photo banner with the page title, as at the top of the old site's inner pages.
// Each page passes the same banner photo the old site used for it.
export function PageBanner({
  title,
  eyebrow,
  image,
}: {
  title: string
  eyebrow?: string
  image: StaticImageData
}) {
  return (
    <section className="page-banner">
      <Image src={image} alt="" fill priority sizes="100vw" className="cover darken" />
      <div className="container page-banner-content">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
      </div>
    </section>
  )
}
