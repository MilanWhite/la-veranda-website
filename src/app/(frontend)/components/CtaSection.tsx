import { getImageProps, type StaticImageData } from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'

import statement from '@/assets/statement.jpg'

// The call-to-action at the bottom of a page. Every one looks the same: a darkened photo
// that stays still while the page scrolls past (like the homepage), a heading, one or two
// short sentences, and up to two buttons. The first button is the main action (solid), the
// second is an alternative (outline).
export function CtaSection({
  title,
  children,
  actions,
  photo = statement,
}: {
  title: string
  children: ReactNode
  actions: [{ label: string; href: string }, { label: string; href: string }?]
  photo?: StaticImageData
}) {
  const src = getImageProps({ src: photo, alt: '', width: 1920 }).props.src
  return (
    <section className="section cta-photo" style={{ ['--cta-image' as string]: `url(${src})` }}>
      <div className="container narrow center cta-content">
        <h2 className="section-title">{title}</h2>
        <div className="lead">{children}</div>
        <div className="button-row button-row-center">
          {actions.flatMap((a, i) => {
            if (!a) return []
            const className = i === 0 ? 'button-solid' : 'button'
            return a.href.startsWith('/') ? (
              <Link key={a.href} href={a.href} className={className}>
                {a.label}
              </Link>
            ) : (
              <a key={a.href} href={a.href} className={className}>
                {a.label}
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
