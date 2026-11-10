import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { revalidateAfterChange, revalidateAfterDelete } from '../hooks/revalidateSite'
import { WEEKDAYS, WEEKS } from '../lib/recurrence'

const title = (s: string) => s[0].toUpperCase() + s.slice(1)
const repeats = (data: unknown) =>
  Boolean((data as { repeat?: { frequency?: string } })?.repeat?.frequency?.match(/weekly|monthly/))

export const Specials: CollectionConfig = {
  slug: 'specials',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'active'],
    group: 'Website',
    description:
      'Special events and holiday menus shown on /specials. One-time specials disappear by themselves after their date; repeating ones (e.g. Salsa Night) always show their next date. Untick "Active" to hide one.',
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
      validate: (value: unknown, { data }: { data: unknown }) =>
        value || !repeats(data) ? true : 'A repeating special needs a start date and time.',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description:
          'Optional for one-time specials. For a repeating special: the first date, and the time it starts every time.',
      },
    },
    {
      name: 'showTime',
      label: 'Show the time on the website',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Untick to show only the day (e.g. when the time is not set yet).' },
    },
    {
      name: 'repeat',
      label: 'Repeats',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'frequency',
              label: 'How often',
              type: 'select',
              defaultValue: 'none',
              options: [
                { label: 'Does not repeat', value: 'none' },
                { label: 'Every week', value: 'weekly' },
                { label: 'Every month', value: 'monthly' },
              ],
            },
            {
              name: 'week',
              label: 'Which week',
              type: 'select',
              options: WEEKS.map((w) => ({ label: title(w), value: w })),
              admin: { condition: (_, siblings) => siblings?.frequency === 'monthly' },
              validate: (
                value: unknown,
                { siblingData }: { siblingData: { frequency?: string } },
              ) => (value || siblingData?.frequency !== 'monthly' ? true : 'Choose which week.'),
            },
            {
              name: 'weekday',
              label: 'Day',
              type: 'select',
              options: WEEKDAYS.map((d) => ({ label: title(d), value: d })),
              admin: { condition: (_, siblings) => repeats({ repeat: siblings }) },
              validate: (value: unknown, { siblingData }: { siblingData: unknown }) =>
                value || !repeats({ repeat: siblingData }) ? true : 'Choose the day.',
            },
          ],
        },
        {
          name: 'until',
          label: 'Repeat until (optional)',
          type: 'date',
          admin: {
            date: { pickerAppearance: 'dayOnly' },
            condition: (_, siblings) => repeats({ repeat: siblings }),
            description: 'Leave empty to keep repeating.',
          },
        },
      ],
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
