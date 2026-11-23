import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import {
  assignRequestNumber,
  enforceStatusRules,
  setStatusOrder,
  recordActivity,
  removeCalendarOnDelete,
  stampInternalNotes,
  syncCalendarOnChange,
} from '../lib/eventRequests/hooks'
import { eventRequestEndpoints } from '../lib/eventRequests/endpoints'

export const STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Declined', value: 'declined' },
  { label: 'Cancelled', value: 'cancelled' },
] as const

const EMAIL_STATUS = [
  { label: 'Not sent', value: 'not_sent' },
  { label: 'Sent', value: 'sent' },
  { label: 'Failed', value: 'failed' },
  { label: 'Skipped (email not set up)', value: 'skipped' },
]
const CALENDAR_STATUS = [
  { label: 'Not synced', value: 'not_synced' },
  { label: 'On calendar', value: 'synced' },
  { label: 'Removed', value: 'removed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Skipped (calendar not set up)', value: 'skipped' },
]

const rowLabel = { RowLabel: '/components/admin/RowLabel#RowLabel' }
const readOnly = { readOnly: true }

// Event requests sent from the form on /events. Created only by the form's server action.
// Staff manage them with the Approve / Decline / Cancel buttons in the top bar; every
// change is written to the History tab in plain words.
export const EventRequests: CollectionConfig = {
  slug: 'event-requests',
  labels: { singular: 'Event Request', plural: 'Event Requests' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['requestNumber', 'status', 'customerName', 'startsOn', 'guests', 'occasion'],
    group: 'Bookings',
    hideAPIURL: true,
    components: {
      edit: {
        // One bar at the top: number, name, date and status, then the actions, Save and ⋯
        beforeDocumentControls: ['/components/admin/RequestHeader#RequestHeader'],
        editMenuItems: ['/components/admin/RequestMenuItems#RequestMenuItems'],
      },
    },
    listSearchableFields: ['title', 'customer.email', 'customer.nameOrCompany'],
    pagination: { defaultLimit: 25 },
  },
  // Pending first, then approved, declined, cancelled; newest request first within each
  // (see setStatusOrder)
  defaultSort: 'statusOrder',
  access: {
    create: () => false,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  endpoints: eventRequestEndpoints,
  hooks: {
    beforeChange: [
      assignRequestNumber,
      enforceStatusRules,
      stampInternalNotes,
      syncCalendarOnChange,
      recordActivity,
      setStatusOrder,
    ],
    afterDelete: [removeCalendarOnDelete],
  },
  fields: [
    // ── Sidebar (hidden on the request page by custom.scss; shown in the top bar instead,
    // and used as the list columns) ──────────────────────────────
    {
      name: 'requestNumber',
      label: 'Request #',
      type: 'number',
      unique: true,
      index: true,
      admin: { position: 'sidebar', ...readOnly },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [...STATUS_OPTIONS],
      index: true,
      // Shown in the top bar and changed with its Approve / Decline / Cancel buttons
      admin: {
        position: 'sidebar',
        readOnly: true,
        components: { Cell: '/components/admin/StatusCell#StatusCell' },
      },
    },
    // Copies of key values for the list view (kept in sync by hooks)
    { name: 'title', type: 'text', admin: { hidden: true } },
    { name: 'statusOrder', type: 'number', index: true, admin: { hidden: true } },
    {
      name: 'customerName',
      label: 'Customer',
      type: 'text',
      admin: { position: 'sidebar', ...readOnly },
    },
    {
      name: 'startsOn',
      label: 'Event date',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
        ...readOnly,
        components: { Cell: '/components/admin/DateCell#DateCell' },
      },
    },
    { name: 'occasion', label: 'Event type', type: 'text', admin: { hidden: true } },
    { name: 'guests', label: 'Guests', type: 'text', admin: { hidden: true } },

    {
      type: 'tabs',
      tabs: [
        // ── Overview: the booking summary (custom component) ───
        {
          label: 'Overview',
          fields: [
            {
              name: 'overview',
              type: 'ui',
              admin: {
                components: {
                  Field: '/components/admin/EventRequestOverview#EventRequestOverview',
                },
              },
            },
          ],
        },

        // ── Internal notes ────────────────────────────────────
        {
          label: 'Internal Notes',
          description: 'Notes for staff only, e.g. what was agreed with the customer by email.',
          fields: [
            {
              name: 'internalNotes',
              type: 'array',
              labels: { singular: 'Note', plural: 'Notes' },
              fields: [
                { name: 'note', type: 'textarea', required: true },
                {
                  type: 'row',
                  fields: [
                    { name: 'author', type: 'text', admin: readOnly },
                    { name: 'addedAt', label: 'Added', type: 'date', admin: readOnly },
                  ],
                },
              ],
            },
          ],
        },

        // ── Customer & Event ───────────────────────────────────
        {
          label: 'Customer & Event',
          description: 'Edit these if details change after talking with the customer.',
          fields: [
            {
              name: 'customer',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'nameOrCompany',
                      label: 'Name / Company',
                      type: 'text',
                      required: true,
                    },
                    { name: 'contactPerson', label: 'Contact person', type: 'text' },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'email', type: 'email', required: true },
                    { name: 'phone', type: 'text', required: true },
                  ],
                },
                { name: 'address', type: 'text' },
              ],
            },
            {
              name: 'event',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'type', label: 'Event type', type: 'text', required: true },
                    {
                      name: 'date',
                      type: 'text',
                      required: true,
                      admin: { description: 'YYYY-MM-DD' },
                      validate: (v: unknown) =>
                        typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
                          ? true
                          : 'Use the format YYYY-MM-DD',
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'startTime',
                      label: 'Start time',
                      type: 'text',
                      required: true,
                      admin: { description: '24-hour, e.g. 12:00' },
                    },
                    {
                      name: 'endTime',
                      label: 'End time',
                      type: 'text',
                      required: true,
                      admin: { description: '24-hour, e.g. 16:00' },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'adults',
                      label: 'Guests (adults)',
                      type: 'number',
                      required: true,
                      min: 0,
                    },
                    { name: 'kids', label: 'Kids', type: 'number', min: 0, defaultValue: 0 },
                  ],
                },
              ],
            },
          ],
        },

        // ── Menu & Extras ─────────────────────────────────────
        {
          label: 'Menu & Extras',
          description: 'What the customer chose, with the prices at the time of the request.',
          fields: [
            {
              name: 'selections',
              type: 'array',
              admin: { components: rowLabel },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'title', label: 'Section', type: 'text', required: true },
                    { name: 'toBeDecided', label: 'To be decided', type: 'checkbox' },
                  ],
                },
                {
                  name: 'items',
                  type: 'array',
                  admin: { components: rowLabel },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'name', type: 'text', required: true },
                        { name: 'upcharge', label: 'Upcharge pp ($)', type: 'number', min: 0 },
                      ],
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'textLabel', label: 'Add-on', type: 'text' },
                    { name: 'text', label: 'Customer’s answer', type: 'text' },
                    { name: 'textUpcharge', label: 'Upcharge pp ($)', type: 'number', min: 0 },
                  ],
                },
              ],
            },
            {
              name: 'extras',
              type: 'array',
              admin: { components: rowLabel },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'price', label: 'Price ($)', type: 'number', min: 0 },
                    {
                      name: 'unit',
                      type: 'select',
                      options: [
                        { label: 'Per event', value: 'event' },
                        { label: 'Per adult', value: 'adult' },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              name: 'details',
              label: 'Additional details',
              type: 'array',
              admin: { components: rowLabel },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', type: 'text', required: true },
                    { name: 'value', type: 'text' },
                  ],
                },
              ],
            },
            {
              name: 'depositAcknowledged',
              label: 'Customer acknowledged the non-refundable deposit',
              type: 'checkbox',
            },
            { name: 'notes', label: 'Customer notes', type: 'textarea' },
          ],
        },

        // ── History ───────────────────────────────────────────
        {
          label: 'History',
          description: 'Everything that happened to this request, newest last.',
          fields: [
            {
              name: 'activity',
              type: 'array',
              admin: { readOnly: true, initCollapsed: false },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'at',
                      type: 'date',
                      admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
                    },
                    { name: 'by', type: 'text', admin: readOnly },
                  ],
                },
                { name: 'message', type: 'text', admin: readOnly },
              ],
            },
          ],
        },

        // ── System: prices at submission, email + calendar status ─
        {
          label: 'System',
          description: 'Recorded automatically.',
          fields: [
            {
              name: 'pricing',
              label: 'Prices when the request was sent',
              type: 'group',
              admin: { readOnly: true },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'adultPrice', type: 'number' },
                    { name: 'kidPrice', type: 'number' },
                    { name: 'spaceFeePercent', type: 'number' },
                    { name: 'includedHours', type: 'number' },
                    { name: 'extraHourPrice', type: 'number' },
                  ],
                },
                {
                  name: 'notes',
                  type: 'array',
                  fields: [{ name: 'text', type: 'text' }],
                },
              ],
            },
            {
              name: 'emails',
              type: 'group',
              admin: { readOnly: true },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'customer',
                      label: 'Customer confirmation',
                      type: 'select',
                      options: EMAIL_STATUS,
                    },
                    {
                      name: 'owner',
                      label: 'Restaurant notification',
                      type: 'select',
                      options: EMAIL_STATUS,
                    },
                    { name: 'sentAt', type: 'date' },
                  ],
                },
                { name: 'error', type: 'text' },
                {
                  // Replies from the admin point to this, so the customer sees one conversation
                  name: 'confirmationMessageId',
                  label: 'Confirmation email ID',
                  type: 'text',
                },
                {
                  // Replies reuse this subject (with "Re:") so they stay in the same conversation
                  name: 'confirmationSubject',
                  label: 'Confirmation email subject',
                  type: 'text',
                },
              ],
            },
            {
              name: 'calendar',
              label: 'Google Calendar',
              type: 'group',
              admin: { readOnly: true },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'status',
                      type: 'select',
                      options: CALENDAR_STATUS,
                    },
                    { name: 'eventId', type: 'text' },
                    { name: 'syncedAt', type: 'date' },
                  ],
                },
                { name: 'error', type: 'text' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
