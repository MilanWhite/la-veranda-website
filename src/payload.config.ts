import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { ContactMessages } from './collections/ContactMessages'
import { EventRequests } from './collections/EventRequests'
import { Media } from './collections/Media'
import { Menus } from './collections/Menus'
import { Specials } from './collections/Specials'
import { Users } from './collections/Users'
import { EventMenu } from './globals/EventMenu'
import { Gallery } from './globals/Gallery'
import { SiteSettings } from './globals/SiteSettings'
import { emailAdapter } from './lib/mail'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    // Designed for light mode only; the dark theme was too high-contrast.
    theme: 'light',
    meta: {
      titleSuffix: ' · La Veranda Admin',
      description: 'La Veranda restaurant & events admin',
    },
    components: {
      graphics: {
        Logo: '/components/admin/Logo#Logo',
        Icon: '/components/admin/Logo#Icon',
      },
      // Logo + "Dashboard" link at the top of the sidebar
      beforeNavLinks: ['/components/admin/NavBrand#NavBrand'],
      // Replaces Payload's default list of collection cards with a bookings-first home.
      views: { dashboard: { Component: '/components/admin/Dashboard#Dashboard' } },
    },
  },
  collections: [EventRequests, ContactMessages, Menus, Specials, Media, Users],
  globals: [EventMenu, Gallery, SiteSettings],
  editor: lexicalEditor(),
  email: emailAdapter(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    // Schema changes go through migrations only (npm run migrate:create / npm run migrate)
    push: false,
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [],
})
