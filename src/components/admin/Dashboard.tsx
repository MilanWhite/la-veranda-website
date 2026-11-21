import { ListView } from '@payloadcms/next/views'
import Link from 'next/link'
import type { AdminViewServerProps } from 'payload'

import { formatTime } from '@/lib/eventRequests/summary'
import { ensureNavDefaults } from '@/lib/adminNav'
import type { EventRequest } from '@/payload-types'

// The admin home is a place to work, not a report: Payload's own Event Requests list in the
// middle (same search, filters and columns as that page) and a full-height "Coming up"
// panel on the right with the confirmed events. (On phones the list shows as cards: see
// custom.scss.)

const REQUESTS = '/admin/collections/event-requests'
const TZ = 'America/Toronto'

const parseYmd = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC', ...opts })
const weekday = fmt({ weekday: 'short' })
const month = fmt({ month: 'short' })

// "60 + 10 kids" → "60 adults, 10 kids"; "60" → "60 guests"
function guestsLabel(guests?: string | null) {
  if (!guests) return null
  const m = guests.match(/^(\d+)\s*\+\s*(\d+)\s*kids?$/)
  return m ? `${m[1]} adults, ${m[2]} kids` : `${guests} guests`
}

export async function Dashboard(props: AdminViewServerProps) {
  const { payload, user } = props.initPageResult.req
  if (user) await ensureNavDefaults(payload, user as { id: number })

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date())
  const upcoming = await payload.find({
    collection: 'event-requests',
    where: {
      and: [{ status: { equals: 'approved' } }, { startsOn: { greater_than_equal: today } }],
    },
    sort: 'startsOn',
    limit: 30,
    depth: 0,
  })

  // Active requests whose confirmation or restaurant email didn't go out
  const failedEmails = await payload.find({
    collection: 'event-requests',
    where: {
      and: [
        { status: { in: ['pending', 'approved'] } },
        {
          or: [
            { 'emails.customer': { equals: 'failed' } },
            { 'emails.owner': { equals: 'failed' } },
          ],
        },
      ],
    },
    sort: '-createdAt',
    limit: 10,
    depth: 0,
  })

  const collectionConfig = payload.collections['event-requests'].config

  return (
    <div className="lvd">
      <div className="lvd-main">
        {failedEmails.totalDocs > 0 && (
          <div className="lvd-alert" role="alert">
            <strong>
              {failedEmails.totalDocs === 1
                ? 'An email for 1 request was not sent:'
                : `Emails for ${failedEmails.totalDocs} requests were not sent:`}
            </strong>{' '}
            {failedEmails.docs.map((r: EventRequest, i) => (
              <span key={r.id}>
                {i > 0 && ', '}
                <Link href={`${REQUESTS}/${r.id}`}>#{r.requestNumber}</Link>
              </span>
            ))}
            . Open the request to see why, then use “Resend emails” in its ⋯ menu.
          </div>
        )}
        {/* Always opens pending-first (statusOrder) unless a sort was picked on this page,
            whatever sort was last used on the Event Requests page. */}
        <ListView
          {...props}
          initPageResult={{ ...props.initPageResult, collectionConfig }}
          query={{
            ...(props.searchParams as Record<string, string>),
            sort: (props.searchParams?.sort as string | undefined) ?? 'statusOrder',
          }}
          enableRowSelections
        />
      </div>

      <aside className="lvd-aside" aria-label="Coming up">
        <div className="lvd-aside-head">
          <h2>Coming up</h2>
          <Link href={`${REQUESTS}?where[status][equals]=approved&sort=startsOn`}>See all</Link>
        </div>
        {upcoming.docs.length ? (
          <ul className="lvd-events">
            {upcoming.docs.map((r: EventRequest) => {
              const date = r.startsOn ? parseYmd(r.startsOn) : null
              return (
                <li key={r.id}>
                  <Link href={`${REQUESTS}/${r.id}`}>
                    {date && (
                      <span className="lvd-day" aria-hidden>
                        <small>{weekday.format(date)}</small>
                        <b>{date.getUTCDate()}</b>
                        <small>{month.format(date)}</small>
                      </span>
                    )}
                    <span className="lvd-event">
                      <strong>{r.customerName}</strong>
                      <span>{r.occasion}</span>
                      <span>
                        {[formatTime(r.event?.startTime), guestsLabel(r.guests)]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="lvd-empty">No confirmed events coming up.</p>
        )}
      </aside>
    </div>
  )
}
