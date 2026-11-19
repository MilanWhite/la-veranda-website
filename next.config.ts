import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  // Rendered on the server only (booking summary PDF)
  serverExternalPackages: ['@react-pdf/renderer'],
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
