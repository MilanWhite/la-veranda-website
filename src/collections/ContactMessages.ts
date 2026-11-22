import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { contactMessageEndpoints } from '../lib/contactReplies'

const EMAIL_STATUS = [
  { label: 'Not sent', value: 'not_sent' },
  { label: 'Sent', value: 'sent' },
  { label: 'Failed', value: 'failed' },
  { label: 'Skipped (email not set up)', value: 'skipped' },
]

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
      // What happened to the emails sent when the message arrived (the visitor's copy and the
      // restaurant's), so a failure shows in the inbox and on the dashboard, not just in logs.
      name: 'emails',
      type: 'group',
      admin: { readOnly: true },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'visitor', label: 'Copy to visitor', type: 'select', options: EMAIL_STATUS },
            {
              name: 'restaurant',
              label: 'Restaurant notification',
              type: 'select',
              options: EMAIL_STATUS,
            },
          ],
        },
        { name: 'error', type: 'text' },
      ],
    },
    {
      // Replies sent from the admin inbox, in the visitor's email conversation
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
