import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

// Sent with every page and file. (No Content-Security-Policy: the admin, Google Maps and
// Turnstile all need inline scripts or other sites, so a strict one would break them.)
const securityHeaders = [
  // Don't let browsers guess a file's type (an upload can't be run as a script)
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Other sites can't show the site or the admin inside a frame (clickjacking)
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Other sites only see "laverandaresto.com" as where a visitor came from, not the full URL
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Features the site never uses
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), payment=(), usb=()' },
  // HTTPS only, for a year. Not for subdomains: the old mail/webmail ones may not have HTTPS.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Rendered on the server only (booking summary PDF)
  serverExternalPackages: ['@react-pdf/renderer'],
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  async redirects() {
    return [
      // The event request form lives on the Events page.
      { source: '/book-an-event', destination: '/events#book-an-event', permanent: true },
      // Old WordPress pages and files that people may still have links to
      { source: '/contract-form', destination: '/events#book-an-event', permanent: true },
      { source: '/events-brunch', destination: '/events', permanent: true },
      { source: '/thank-you', destination: '/events', permanent: true },
      {
        source: '/wp-content/uploads/2023/08/BrunchMenuMay2025.pdf',
        destination: '/api/media/file/brunch-menu.pdf',
        permanent: true,
      },
      {
        source:
          '/wp-content/uploads/2023/08/New-Event-Menu-Options-La-Veranda-2-Pages-latest-2023.pdf',
        destination: '/api/media/file/group-menu.pdf',
        permanent: true,
      },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
