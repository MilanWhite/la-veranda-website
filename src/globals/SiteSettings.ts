import type { GlobalConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { revalidateGlobalAfterChange } from '../hooks/revalidateSite'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: { group: 'Website' },
  access: {
    read: () => true,
    update: authenticated,
  },
  hooks: {
    afterChange: [revalidateGlobalAfterChange],
  },
  fields: [
    { name: 'restaurantName', type: 'text', required: true, defaultValue: 'La Veranda' },
    { name: 'phone', type: 'text' },
    { name: 'email', type: 'email' },
    { name: 'address', type: 'textarea' },
    {
      name: 'socialLinks',
      type: 'array',
      fields: [
        { name: 'platform', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'hours',
      type: 'array',
      admin: { description: 'Fallback hours, e.g. "Mon–Thu" / "11am – 10pm".' },
      fields: [
        { name: 'days', type: 'text', required: true },
        { name: 'time', type: 'text', required: true },
        { name: 'note', type: 'text', admin: { description: 'e.g. "Kitchen closes at 2:30pm"' } },
      ],
    },
    {
      name: 'groupMenuPdf',
      label: 'Event group menu (PDF)',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Linked as "Download Group Menu" on the Events page.' },
    },
    {
      name: 'seo',
      label: 'Default SEO',
      type: 'group',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      // Not public: hidden from the public API.
      name: 'internal',
      type: 'group',
      access: { read: ({ req }) => Boolean(req.user) },
      fields: [
        {
          name: 'notificationEmails',
          label: 'Event request email recipients',
          type: 'array',
          fields: [{ name: 'email', type: 'email', required: true }],
        },
        { name: 'googleCalendarId', type: 'text' },
      ],
    },
  ],
}
