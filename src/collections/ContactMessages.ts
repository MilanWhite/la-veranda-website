import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

// Messages from the "Let's Talk" form on /contact. Created only by the form's server action
// (never through the public API); only signed-in admins can read them.
export const ContactMessages: CollectionConfig = {
  slug: 'contact-messages',
  labels: { singular: 'Contact Message', plural: 'Contact Messages' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['firstName', 'lastName', 'email', 'phone', 'handled', 'createdAt'],
    group: 'Bookings',

    description: 'Messages sent through the form on the Contact page. Tick "Handled" once replied.',
  },
  defaultSort: '-createdAt',
  access: {
    create: () => false,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'firstName', type: 'text', required: true, admin: { readOnly: true } },
        { name: 'lastName', type: 'text', admin: { readOnly: true } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'email', type: 'email', required: true, admin: { readOnly: true } },
        { name: 'phone', type: 'text', admin: { readOnly: true } },
      ],
    },
    { name: 'message', type: 'textarea', required: true, admin: { readOnly: true } },
    {
      name: 'handled',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
  ],
}
