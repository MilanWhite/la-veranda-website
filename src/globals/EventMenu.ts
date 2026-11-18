import type { GlobalConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { revalidateGlobalAfterChange } from '../hooks/revalidateSite'

const rowLabel = { RowLabel: '/components/admin/RowLabel#RowLabel' }

// Everything the public event request form offers: prices, rules and menu choices.
// Requests keep a snapshot of these values, so editing them never changes old requests.
export const EventMenu: GlobalConfig = {
  slug: 'event-menu',
  label: 'Event Menu & Form',
  admin: {
    group: 'Setup',
    description:
      'Prices, rules and menu choices used by the event request form on /events. Changes apply to new requests only.',
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
      // Opens the tab named in the link, e.g. #reply-templates (from a request's Reply menu)
      name: 'openTab',
      type: 'ui',
      admin: { components: { Field: '/components/admin/OpenTabFromHash#OpenTabFromHash' } },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Prices & Rules',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'adultPrice',
                  label: 'Adult price ($)',
                  type: 'number',
                  required: true,
                  min: 0,
                },
                {
                  name: 'kidPrice',
                  label: 'Kids price ($)',
                  type: 'number',
                  required: true,
                  min: 0,
                },
                {
                  name: 'spaceFeePercent',
                  label: 'Space setup fee (%)',
                  type: 'number',
                  required: true,
                  min: 0,
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'includedHours',
                  label: 'Hours included',
                  type: 'number',
                  required: true,
                  min: 1,
                },
                {
                  name: 'extraHourPrice',
                  label: 'Each extra hour ($)',
                  type: 'number',
                  required: true,
                  min: 0,
                },
                {
                  name: 'timeLimitNote',
                  label: 'Time limit note',
                  type: 'text',
                  admin: { description: 'e.g. "(excluding Open Bar)"' },
                },
              ],
            },
            {
              // Extra lines for "Pricing & Notes" (form, emails, PDF, admin). Base price,
              // space fee, per-adult extras and the time limit are written automatically from
              // the prices above; these add anything else, like the gratuity policy or deposit.
              name: 'extraNotes',
              label: 'Extra lines in "Pricing & Notes"',
              labels: { singular: 'Line', plural: 'Lines' },
              type: 'array',
              admin: {
                components: rowLabel,
                description:
                  'Shown in "Pricing & Notes" on the form, the emails and the PDF, between the lines written from the prices above (Base Price, Space Setup Fee, Open Bar, Time Limit). Choose where each line goes; lines in the same spot follow this list order (drag to reorder).',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'title',
                      label: 'Heading',
                      type: 'text',
                      required: true,
                      admin: { width: '50%', placeholder: 'e.g. Gratuity Policy' },
                    },
                    {
                      name: 'position',
                      label: 'Where it shows',
                      type: 'select',
                      required: true,
                      defaultValue: 'end',
                      // Between the lines written automatically from the prices. Lines that
                      // share a spot follow the order of this list (drag to reorder).
                      options: [
                        { label: 'At the very top (before Base Price)', value: 'top' },
                        { label: 'After Base Price', value: 'afterBase' },
                        { label: 'After Space Setup Fee', value: 'afterFee' },
                        { label: 'After Open Bar / per-adult extras', value: 'afterExtras' },
                        { label: 'At the end (after Time Limit)', value: 'end' },
                      ],
                      admin: { width: '50%' },
                    },
                  ],
                },
                { name: 'text', type: 'textarea', required: true },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'earliestStart',
                  label: 'Earliest start time',
                  type: 'text',
                  required: true,
                  defaultValue: '09:00',
                  admin: { description: '24-hour time, e.g. 09:00' },
                },
                {
                  name: 'latestStart',
                  label: 'Latest start time',
                  type: 'text',
                  required: true,
                  defaultValue: '22:00',
                },
                {
                  name: 'startStepMinutes',
                  label: 'Start time step (minutes)',
                  type: 'number',
                  required: true,
                  defaultValue: 30,
                  min: 5,
                },
              ],
            },
            {
              name: 'eventTypes',
              type: 'array',
              required: true,
              admin: { components: rowLabel, initCollapsed: true },
              fields: [{ name: 'name', type: 'text', required: true }],
            },
          ],
        },
        {
          label: 'Menu Choices',
          fields: [
            {
              name: 'sections',
              type: 'array',
              admin: {
                components: rowLabel,
                initCollapsed: true,
                description: 'Starters, Penne, Main Dish, Kids Menu…',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'title', type: 'text', required: true },
                    {
                      name: 'key',
                      type: 'text',
                      required: true,
                      admin: { description: 'Short id, e.g. "starters". Don’t change once used.' },
                    },
                  ],
                },
                { name: 'description', type: 'text' },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'selection',
                      type: 'select',
                      required: true,
                      defaultValue: 'multiple',
                      options: [
                        { label: 'Pick one (dropdown)', value: 'single' },
                        { label: 'Pick several (checkboxes)', value: 'multiple' },
                      ],
                    },
                    {
                      name: 'min',
                      label: 'Minimum picks',
                      type: 'number',
                      defaultValue: 0,
                      min: 0,
                    },
                    {
                      name: 'max',
                      label: 'Maximum picks',
                      type: 'number',
                      admin: { description: 'Empty = no limit' },
                      min: 0,
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'allowToBeDecided',
                      label: 'Allow "To be decided"',
                      type: 'checkbox',
                    },
                    {
                      name: 'forKids',
                      label: 'Only when kids are attending',
                      type: 'checkbox',
                    },
                    {
                      name: 'priceTag',
                      label: 'Show price in heading',
                      type: 'select',
                      options: [
                        { label: 'Adult price + taxes and space fee', value: 'adult' },
                        { label: 'Kids price', value: 'kids' },
                      ],
                    },
                  ],
                },
                {
                  name: 'options',
                  type: 'array',
                  admin: { components: rowLabel, initCollapsed: true },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'name', type: 'text', required: true },
                        {
                          name: 'upcharge',
                          label: 'Upcharge per person ($)',
                          type: 'number',
                          defaultValue: 0,
                          min: 0,
                        },
                        { name: 'available', type: 'checkbox', defaultValue: true },
                      ],
                    },
                  ],
                },
                {
                  name: 'textOption',
                  label: 'Optional text add-on',
                  type: 'group',
                  admin: { description: 'e.g. "Add Risotto Type (optional) +$5"' },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'label', type: 'text' },
                        {
                          name: 'upcharge',
                          label: 'Upcharge per person ($)',
                          type: 'number',
                          min: 0,
                        },
                        { name: 'placeholder', type: 'text' },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Extras & Details',
          fields: [
            {
              name: 'extras',
              type: 'array',
              admin: { components: rowLabel, initCollapsed: true },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'price', label: 'Price ($)', type: 'number', required: true, min: 0 },
                    {
                      name: 'unit',
                      type: 'select',
                      required: true,
                      defaultValue: 'event',
                      options: [
                        { label: 'Per event', value: 'event' },
                        { label: 'Per adult', value: 'adult' },
                      ],
                    },
                    { name: 'available', type: 'checkbox', defaultValue: true },
                  ],
                },
              ],
            },
            {
              name: 'choices',
              label: 'Additional details',
              type: 'array',
              admin: {
                components: rowLabel,
                initCollapsed: true,
                description: 'Radio questions such as Wine Service and Alcohol.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', type: 'text', required: true },
                    { name: 'key', type: 'text', required: true },
                  ],
                },
                {
                  name: 'options',
                  type: 'array',
                  admin: { components: rowLabel },
                  fields: [{ name: 'label', type: 'text', required: true }],
                },
              ],
            },
          ],
        },
        {
          label: 'Reply Templates',
          description:
            'Ready-made replies for the Reply button on a request. Placeholders are filled in from the request: {name} (contact person, or the name/company), {company}, {number}, {eventType}, {date}, {time}, {guests}. You can edit the message before sending; it goes out as a reply in the customer’s conversation (subject “Re: Your event request #… at La Veranda”).',
          fields: [
            {
              name: 'replyTemplates',
              label: 'Reply templates',
              labels: { singular: 'Template', plural: 'Templates' },
              type: 'array',
              // Staff-only wording: not part of the public form data
              access: { read: ({ req }) => Boolean(req.user) },
              admin: { components: rowLabel, initCollapsed: true },
              fields: [
                {
                  name: 'name',
                  label: 'Name (shown in the Reply menu)',
                  type: 'text',
                  required: true,
                  admin: { placeholder: 'e.g. Ready to proceed' },
                },
                {
                  name: 'body',
                  label: 'Message',
                  type: 'textarea',
                  required: true,
                  admin: { rows: 10 },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
