import type { MetadataRoute } from 'next'

// /robots.txt: search engines may read the public pages, not the admin or the API.
export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }],
    sitemap: `${base}/sitemap.xml`,
  }
}
