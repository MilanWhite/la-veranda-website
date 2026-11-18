import path from 'path'
import type { CollectionConfig } from 'payload'

import { revalidateAfterChange, revalidateAfterDelete } from '../hooks/revalidateSite'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Website' },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: { description: 'Describe the image for screen readers and search engines.' },
    },
  ],
  upload: {
    // MEDIA_DIR lets the test database keep its uploads apart from the dev ones.
    staticDir: path.resolve(process.cwd(), process.env.MEDIA_DIR || 'media'),
    mimeTypes: ['image/*', 'application/pdf'],
  },
}
