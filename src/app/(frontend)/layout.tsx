import type { Metadata } from 'next'
import { Playfair_Display, Source_Sans_3 } from 'next/font/google'
import React from 'react'

import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { ScrollReveal } from './components/ScrollReveal'
import { getSiteSettings } from './getSiteSettings'
import './globals.css'
import { revealHideCss } from './lib/reveal'

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-heading' })
const sourceSans = Source_Sans_3({ subsets: ['latin'], variable: '--font-body' })

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const siteTitle = settings.seo?.title || settings.restaurantName
  // Link previews (iMessage, WhatsApp, Facebook…): Site Settings → Default SEO → Image if set,
  // otherwise public/og-image.jpg. Best at 1200 × 630.
  const seoImage = typeof settings.seo?.image === 'object' ? settings.seo.image?.url : null
  return {
    // Full addresses for canonical links and share images (the live domain once launched)
    metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
    title: { default: siteTitle, template: `%s | ${settings.restaurantName}` },
    description: settings.seo?.description,
    openGraph: {
      type: 'website',
      siteName: settings.restaurantName,
      locale: 'en_CA',
      images: [{ url: seoImage || '/og-image.jpg', width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image' },
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // reveal-on: entrance animations (lib/reveal.ts) hide the parts until they scroll in
    <html lang="en" className={`${playfair.variable} ${sourceSans.variable} reveal-on`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: revealHideCss }} />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <ScrollReveal />
      </body>
    </html>
  )
}
