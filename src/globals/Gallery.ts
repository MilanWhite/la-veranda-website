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
