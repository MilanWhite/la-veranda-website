import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { ensureNavDefaults } from '../lib/adminNav'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Admin User', plural: 'Admin Users' },
  admin: {
    useAsTitle: 'email',
    group: 'Setup',
  },
  access: {
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  auth: {
    forgotPassword: {
      // Full link from NEXT_PUBLIC_SERVER_URL. (Payload's serverURL isn't set: it would make
      // media URLs absolute, which next/image rejects.)
      generateEmailHTML: (args) => {
        const url = `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}/admin/reset/${args?.token}`
        return `<p>You (or someone else) asked to reset the password for your La Veranda admin account. Click the link below, or paste it into your browser:</p><p><a href="${url}">${url}</a></p><p>If you didn't ask for this, ignore this email and your password stays the same.</p>`
      },
    },
  },
  hooks: {
    // First sign-in: start with only the daily "Bookings" group open in the sidebar.
    afterLogin: [
      async ({ req, user }) => {
        // Only a sidebar default: never let it stop someone from signing in.
        try {
          await ensureNavDefaults(req.payload, user, req)
        } catch (err) {
          req.payload.logger.error({ err, msg: 'Could not set default sidebar groups' })
        }
      },
    ],
  },
  fields: [],
}
