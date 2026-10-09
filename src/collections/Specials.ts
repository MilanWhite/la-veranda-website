import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { revalidateAfterChange, revalidateAfterDelete } from '../hooks/revalidateSite'

export const Specials: CollectionConfig = {
  slug: 'specials',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'active'],
    group: 'Website',
    description:
      'Special events and holiday menus shown on /specials. Untick "Active" to hide one.',
  },
  defaultSort: 'date',
  access: {
    read: () => true,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'date',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Optional. Specials are listed by date.',
      },
    },
    { name: 'description', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'cta',
      label: 'Button',
      type: 'group',
      admin: { description: 'Optional link button, e.g. "Reserve a table" → /reservations' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text' },
            { name: 'url', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar', description: 'Only active specials appear on the site.' },
    },
  ],
}
