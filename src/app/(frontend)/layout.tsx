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
  return {
    title: { default: siteTitle, template: `%s | ${settings.restaurantName}` },
    description: settings.seo?.description,
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
