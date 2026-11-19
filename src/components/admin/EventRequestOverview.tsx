import type { UIFieldServerProps } from 'payload'

import { requestNotes, summaryRows } from '@/lib/eventRequests/summary'
import type { EventRequest } from '@/payload-types'

const EMAIL_TEXT: Record<string, string> = {
  not_sent: 'not sent',
  sent: 'sent',
  failed: 'failed',
  skipped: 'skipped (email not set up)',
}
const CAL_TEXT: Record<string, string> = {
  not_synced: 'not on calendar',
  synced: 'on calendar',
  removed: 'removed from calendar',
  failed: 'sync failed',
  skipped: 'skipped (calendar not set up)',
}

const when = (iso?: string | null) =>
  iso
    ? new Intl.DateTimeFormat('en-CA', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'America/Toronto',
      }).format(new Date(iso))
    : ''

// Google's raw errors ("Not Found", "Forbidden") explained in plain words.
function calendarProblem(error?: string | null) {
  const fix = 'Then use ⋯ → Sync Google Calendar again.'
  if (/not found|404/i.test(error ?? ''))
    return `Couldn’t add this to Google Calendar: the calendar wasn’t found. Check the calendar ID in Site Settings and that the calendar is shared with the website’s Google account (“Make changes to events”). ${fix}`
  if (/forbidden|403|permission/i.test(error ?? ''))
    return `Couldn’t add this to Google Calendar: the website isn’t allowed to change that calendar. Share it with the website’s Google account with “Make changes to events”. ${fix}`
  return `Couldn’t update Google Calendar${error ? ` (${error})` : ''}. ${fix}`
}

// The "Overview" tab: the same booking summary as the PDF, nothing else. Delivery status
// and dates sit in small print underneath; problems (a failed email or calendar sync) are
// the only thing that stands out.
export function EventRequestOverview({ data, id }: UIFieldServerProps) {
  const r = data as EventRequest
  if (!id || !r?.requestNumber) {
    return <p className="lv-muted">Event requests are created from the form on the website.</p>
  }

  const notes = requestNotes(r)
  const problems = [
    r.emails?.error && `Email problem: ${r.emails.error}`,
    r.calendar?.status === 'failed' && calendarProblem(r.calendar.error),
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="lv-sheet">
      <h2>Booking Summary</h2>
      <table className="lv-sheet-table">
        <tbody>
          {summaryRows(r).map((row) => (
            <tr key={row.label}>
              <th>{row.label}</th>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {notes.length > 0 && (
        <>
          <h3>Pricing &amp; Notes</h3>
          <ul className="lv-sheet-notes">
            {notes.map((n) => {
              const i = n.indexOf(':')
              return (
                <li key={n}>
                  {i > 0 ? (
                    <>
                      <strong>{n.slice(0, i + 1)}</strong>
                      {n.slice(i + 1)}
                    </>
                  ) : (
                    n
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}

      {problems && <p className="lv-msg lv-msg-error">{problems}</p>}

      <p className="lv-sheet-meta">
        Customer email {EMAIL_TEXT[r.emails?.customer ?? 'not_sent']} · Restaurant email{' '}
        {EMAIL_TEXT[r.emails?.owner ?? 'not_sent']} · Google Calendar:{' '}
        {CAL_TEXT[r.calendar?.status ?? 'not_synced']}
        <br />
        Received {when(r.createdAt)} · Last changed {when(r.updatedAt)}
      </p>
    </div>
  )
}
