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
  auth: true,
  hooks: {
    // First sign-in: start with only the daily "Bookings" group open in the sidebar.
    afterLogin: [
      async ({ req, user }) => {
        await ensureNavDefaults(req.payload, user)
      },
    ],
  },
  fields: [],
}
