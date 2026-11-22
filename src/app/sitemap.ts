import type { MetadataRoute } from 'next'

// /sitemap.xml: the public pages, for Google Search Console.
const PAGES = [
  '/',
  '/menu',
  '/brunch-menu',
  '/events',
  '/weddings-corporate',
  '/specials',
  '/gallery',
  '/contact',
  '/reservations',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')
  return PAGES.map((path) => ({ url: `${base}${path === '/' ? '' : path}` || base }))
}
