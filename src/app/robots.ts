import type { MetadataRoute } from 'next'

// /robots.txt: search engines may read the public pages, not the admin or the API.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }],
  }
}
