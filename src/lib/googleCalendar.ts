import { JWT } from 'google-auth-library'

import type { EventRequest } from '../payload-types'

// One-way sync: website → Google Calendar, using a service account that the calendar is
// shared with ("Make changes to events"). Timezone America/Toronto.

const TIMEZONE = 'America/Toronto'
const API = 'https://www.googleapis.com/calendar/v3'

export type CalendarResult = {
  status: 'synced' | 'removed' | 'failed' | 'skipped'
  eventId?: string
  error?: string
}

// Accepts the key as copied from the JSON file ("-----BEGIN PRIVATE KEY-----\n…"), with
// real or "\n" line breaks, or just the base64 body without the BEGIN/END lines.
function normalizeKey(raw?: string) {
  if (!raw) return null
  const key = raw
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\\n/g, '\n')
  if (key.includes('-----BEGIN')) return key
  const body = key.replace(/\s+/g, '')
  return `-----BEGIN PRIVATE KEY-----\n${body.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----\n`
}

function credentials() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key = normalizeKey(process.env.GOOGLE_PRIVATE_KEY)
  return email && key ? { email, key } : null
}

let client: JWT | null = null
function getClient() {
  const creds = credentials()
  if (!creds) return null
  client ??= new JWT({
    email: creds.email,
    key: creds.key,
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
  })
  return client
}

/**
 * Same request → same Google event id, so approving twice can never create a duplicate.
 * Google ids allow only a–v and 0–9.
 */
export function calendarEventId(requestId: number | string) {
  return `lvreq${String(requestId).replace(/[^0-9a-v]/g, '')}`
}

function addOneDay(date: string) {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

function eventBody(r: EventRequest, opts: { location?: string | null; adminUrl?: string }) {
  const date = r.event.date
  const start = r.event.startTime
  const end = r.event.endTime
  const endDate = end <= start ? addOneDay(date) : date // past midnight
  const guests = `${r.event.adults} adults${r.event.kids ? ` + ${r.event.kids} kids` : ''}`
  const lines = [
    `Request #${r.requestNumber}`,
    `${r.customer.nameOrCompany}${r.customer.contactPerson ? ` (contact: ${r.customer.contactPerson})` : ''}`,
    `Phone: ${r.customer.phone}`,
    `Email: ${r.customer.email}`,
    `Guests: ${guests}`,
    r.notes ? `Notes: ${r.notes}` : '',
    opts.adminUrl ? `Open in admin: ${opts.adminUrl}` : '',
  ].filter(Boolean)

  return {
    summary: `${r.event.type}: ${r.customer.nameOrCompany} (${guests})`,
    description: lines.join('\n'),
    location: opts.location?.replace(/\s+/g, ' ') || undefined,
    start: { dateTime: `${date}T${start}:00`, timeZone: TIMEZONE },
    end: { dateTime: `${endDate}T${end}:00`, timeZone: TIMEZONE },
    status: 'confirmed',
  }
}

function errorMessage(error: unknown) {
  const e = error as {
    response?: { status?: number; data?: { error?: { message?: string } } }
    message?: string
  }
  return e.response?.data?.error?.message || e.message || 'Unknown error'
}

function status(error: unknown) {
  return (error as { response?: { status?: number } }).response?.status
}

/** Creates the event, or updates it (and restores it if it was cancelled). */
export async function upsertCalendarEvent(
  calendarId: string | null | undefined,
  r: EventRequest,
  opts: { location?: string | null; adminUrl?: string } = {},
): Promise<CalendarResult> {
  const google = getClient()
  if (!google || !calendarId) return { status: 'skipped', error: 'Google Calendar is not set up' }
  const id = calendarEventId(r.id)
  const base = `${API}/calendars/${encodeURIComponent(calendarId)}/events`
  const body = eventBody(r, opts)
  try {
    try {
      await google.request({ url: `${base}/${id}`, method: 'PUT', data: body, timeout: 10_000 })
    } catch (error) {
      if (status(error) !== 404) throw error
      await google.request({ url: base, method: 'POST', data: { id, ...body }, timeout: 10_000 })
    }
    return { status: 'synced', eventId: id }
  } catch (error) {
    return { status: 'failed', eventId: id, error: errorMessage(error) }
  }
}

export async function removeCalendarEvent(
  calendarId: string | null | undefined,
  requestId: number | string,
): Promise<CalendarResult> {
  const google = getClient()
  if (!google || !calendarId) return { status: 'skipped', error: 'Google Calendar is not set up' }
  const id = calendarEventId(requestId)
  try {
    await google.request({
      url: `${API}/calendars/${encodeURIComponent(calendarId)}/events/${id}`,
      method: 'DELETE',
      timeout: 10_000,
    })
    return { status: 'removed', eventId: id }
  } catch (error) {
    // Already gone counts as removed.
    if (status(error) === 404 || status(error) === 410) return { status: 'removed', eventId: id }
    return { status: 'failed', eventId: id, error: errorMessage(error) }
  }
}
