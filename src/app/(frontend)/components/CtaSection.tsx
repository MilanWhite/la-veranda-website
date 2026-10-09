import Image, { type StaticImageData } from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'

import statement from '@/assets/statement.jpg'

// Centered heading + text + button(s), used at the bottom of most pages.
// `photo` puts the old site's statement photo (or another image) behind it, darkened.
export function CtaSection({
  title,
  children,
  actions,
  alt = false,
  photo,
}: {
  title: string
  children: ReactNode
  actions: { label: string; href: string; solid?: boolean }[]
  alt?: boolean
  photo?: true | StaticImageData
}) {
  const image = photo === true ? statement : photo
  return (
    <section className={`section${alt ? ' section-alt' : ''}${image ? ' cta-photo' : ''}`}>
      {image && <Image src={image} alt="" fill sizes="100vw" className="cover darken" />}
      <div className="container narrow center cta-content">
        <h2 className="section-title">{title}</h2>
        <div className="lead">{children}</div>
        <div className="button-row button-row-center">
          {actions.map((a) =>
            a.href.startsWith('/') ? (
              <Link key={a.href} href={a.href} className={a.solid ? 'button-solid' : 'button'}>
                {a.label}
              </Link>
            ) : (
              <a key={a.href} href={a.href} className={a.solid ? 'button-solid' : 'button'}>
                {a.label}
              </a>
            ),
          )}
        </div>
      </div>
    </section>
  )
}
