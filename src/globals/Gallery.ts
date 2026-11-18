import type { GlobalConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { revalidateGlobalAfterChange } from '../hooks/revalidateSite'

export const Gallery: GlobalConfig = {
  slug: 'gallery',
  admin: {
    group: 'Website',
    description: 'Photos on /gallery. Drag to reorder. Each image uses its Media "alt" text.',
  },
  access: {
    read: () => true,
    update: authenticated,
  },
  hooks: {
    afterChange: [revalidateGlobalAfterChange],
  },
  fields: [
    {
      name: 'images',
      type: 'array',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'image', type: 'upload', relationTo: 'media', required: true },
            {
              name: 'category',
              type: 'select',
              required: true,
              defaultValue: 'restaurant',
              options: [
                { label: 'Food', value: 'food' },
                { label: 'Events', value: 'events' },
                { label: 'Restaurant', value: 'restaurant' },
              ],
              admin: { description: 'Used by the filter tabs on /gallery.' },
            },
            {
              name: 'showOnEventsPage',
              label: 'Also show on Events page',
              type: 'checkbox',
            },
          ],
        },
      ],
    },
  ],
}
