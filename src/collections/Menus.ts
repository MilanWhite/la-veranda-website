import type { ArrayField, CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { revalidateAfterChange, revalidateAfterDelete } from '../hooks/revalidateSite'

const rowLabel = { RowLabel: '/components/admin/RowLabel#RowLabel' }

// "+ $X" extras such as "Add grilled chicken or shrimp".
const addOns = (description: string): ArrayField => ({
  name: 'addOns',
  label: 'Add-ons',
  type: 'array',
  admin: { description, initCollapsed: true, components: rowLabel },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'label', type: 'text', required: true, admin: { width: '70%' } },
        { name: 'price', type: 'number', required: true, min: 0, admin: { width: '30%' } },
      ],
    },
  ],
})

export const Menus: CollectionConfig = {
  slug: 'menus',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    group: 'Website',
    description: 'The dinner and brunch menus shown on /menu and /brunch-menu.',
  },
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
    {
      type: 'row',
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'slug',
          label: 'Page',
          type: 'select',
          required: true,
          unique: true,
          options: [
            { label: 'Dinner menu (/menu)', value: 'dinner' },
            { label: 'Brunch menu (/brunch-menu)', value: 'brunch' },
          ],
        },
      ],
    },
    { name: 'intro', type: 'textarea', admin: { description: 'Optional text under the title.' } },
    {
      type: 'row',
      fields: [
        {
          name: 'pdf',
          label: 'Downloadable PDF',
          type: 'upload',
          relationTo: 'media',
          admin: { width: '50%' },
        },
        {
          name: 'pdfLabel',
          label: 'PDF button text',
          type: 'text',
          admin: { width: '50%', placeholder: 'Download Menu' },
        },
      ],
    },
    {
      name: 'sections',
      type: 'array',
      admin: {
        initCollapsed: true,
        components: rowLabel,
        description: 'Drag sections and items to reorder them.',
      },
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'isSubgroup',
          label: 'Sub-group of the previous section',
          type: 'checkbox',
          admin: {
            description: 'e.g. "Benedicts" inside Savouries. Shown with a smaller heading.',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          admin: { description: 'e.g. "Served on an English muffin with poached eggs…"' },
        },
        {
          name: 'note',
          type: 'text',
          admin: { description: 'Shown after the items, e.g. "All pasta is made in-house".' },
        },
        addOns('Extras that apply to every item in this section.'),
        {
          name: 'items',
          type: 'array',
          admin: { initCollapsed: true, components: rowLabel },
          fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'description', type: 'textarea' },
            {
              type: 'row',
              fields: [
                {
                  name: 'price',
                  type: 'number',
                  min: 0,
                  admin: { width: '33%', description: 'Leave empty if there are size options.' },
                },
                {
                  name: 'priceLabel',
                  type: 'text',
                  admin: { width: '33%', description: 'Shown before the price, e.g. "10oz".' },
                },
              ],
            },
            {
              name: 'variants',
              label: 'Size / price options',
              type: 'array',
              admin: {
                initCollapsed: true,
                components: rowLabel,
                description: 'e.g. Glass $12 · Pitcher $45. Use instead of a single price.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', type: 'text', required: true, admin: { width: '70%' } },
                    {
                      name: 'price',
                      type: 'number',
                      required: true,
                      min: 0,
                      admin: { width: '30%' },
                    },
                  ],
                },
              ],
            },
            addOns('Extras for this item only.'),
            {
              type: 'row',
              fields: [
                {
                  name: 'available',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: { width: '33%', description: 'Unticked items are hidden on the site.' },
                },
                {
                  name: 'featured',
                  label: 'Show on homepage',
                  type: 'select',
                  options: [
                    { label: 'Popular Dishes', value: 'popular' },
                    { label: 'Our Recommendation', value: 'recommendation' },
                  ],
                  admin: { width: '33%' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
