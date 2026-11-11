import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { ContactMessages } from './collections/ContactMessages'
import { Media } from './collections/Media'
import { Menus } from './collections/Menus'
import { Specials } from './collections/Specials'
import { Users } from './collections/Users'
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
  },
  collections: [ContactMessages, Menus, Specials, Media, Users],
  globals: [Gallery, SiteSettings],
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
