import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { contactMessageEndpoints } from '../lib/contactReplies'

// Messages from the "Let's Talk" form on /contact. Created only by the form's server action
// (never through the public API); only signed-in admins can read them.
export const ContactMessages: CollectionConfig = {
  slug: 'contact-messages',
  labels: { singular: 'Contact Message', plural: 'Contact Messages' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['firstName', 'lastName', 'email', 'phone', 'handled', 'createdAt'],
    group: 'Bookings',
    hideAPIURL: true,
    // Shown as a readable inbox (full messages, Reply and "Mark as handled" on each one)
    // instead of a table you have to click into.
    components: { views: { list: { Component: '/components/admin/MessagesInbox#MessagesInbox' } } },
  },
  defaultSort: '-createdAt',
  endpoints: contactMessageEndpoints,
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
    {
      // Replies sent from the admin inbox (each one quotes the visitor's message)
      name: 'replies',
      type: 'array',
      admin: { readOnly: true },
      fields: [
        { name: 'message', type: 'textarea' },
        { name: 'sentBy', type: 'text' },
        { name: 'sentAt', type: 'date' },
        // Later replies point to the earlier ones, so they form one email conversation
        { name: 'messageId', type: 'text' },
      ],
    },
  ],
}
