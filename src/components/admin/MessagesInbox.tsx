import { Gutter } from '@payloadcms/ui'
import Link from 'next/link'
import type { Payload } from 'payload'

import type { ContactMessage } from '@/payload-types'
import { quotedOriginal } from '@/lib/contactReplies'
import { ContactReplyButton } from './ContactReplyButton'
import { MessageHandledButton } from './MessageHandledButton'

const BASE = '/admin/collections/contact-messages'
const FILTERS = [
  { key: 'open', label: 'Unanswered', where: { handled: { not_equals: true } } },
  { key: 'handled', label: 'Handled', where: { handled: { equals: true } } },
  { key: 'all', label: 'All', where: {} },
] as const

const when = (iso: string) =>
  new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Toronto',
  }).format(new Date(iso))

/** A plain sentence when an email sent for the message didn't go out, otherwise null. */
function emailProblem(m: ContactMessage) {
  const visitor = m.emails?.visitor === 'failed'
  const restaurant = m.emails?.restaurant === 'failed'
  if (visitor && restaurant)
    return 'Neither the visitor’s copy nor the restaurant’s notification was sent.'
  if (visitor) return 'The visitor didn’t get their copy of this message.'
  if (restaurant) return 'The restaurant notification for this message wasn’t sent.'
  return null
}

// Contact messages as an inbox: every message is readable right in the list, with Reply
// and "Mark as handled" on it. No clicking into greyed-out form fields.
export async function MessagesInbox({
  payload,
  searchParams,
}: {
  payload: Payload
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const show = FILTERS.find((f) => f.key === searchParams?.show) ?? FILTERS[0]
  const { docs, totalDocs } = await payload.find({
    collection: 'contact-messages',
    where: show.where,
    sort: '-createdAt',
    limit: 100,
    depth: 0,
  })

  return (
    <Gutter className="lv-inbox">
      <div className="lv-inbox-head">
        <h1>Contact Messages</h1>
        <nav className="lv-inbox-filters" aria-label="Show">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={f.key === 'open' ? BASE : `${BASE}?show=${f.key}`}
              aria-current={f.key === show.key ? 'page' : undefined}
            >
              {f.label}
            </Link>
          ))}
        </nav>
      </div>

      {docs.length ? (
        <ul className="lv-inbox-list">
          {docs.map((m: ContactMessage) => {
            const name = [m.firstName, m.lastName].filter(Boolean).join(' ')
            return (
              <li key={m.id} className={m.handled ? 'is-handled' : undefined}>
                <div className="lv-inbox-meta">
                  <strong>{name}</strong>
                  <span>
                    <a href={`mailto:${m.email}`}>{m.email}</a>
                    {m.phone && (
                      <>
                        {' · '}
                        <a href={`tel:${m.phone.replace(/[^\d+]/g, '')}`}>{m.phone}</a>
                      </>
                    )}
                  </span>
                  <time dateTime={m.createdAt}>{when(m.createdAt)}</time>
                </div>
                <p className="lv-inbox-message">{m.message}</p>
                {emailProblem(m) && (
                  <p className="lv-inbox-warning" role="alert">
                    {emailProblem(m)} Reply below, or email {m.firstName} directly.
                    {m.emails?.error && <small>{m.emails.error}</small>}
                  </p>
                )}
                {(m.replies ?? []).map((r) => (
                  <div key={r.id} className="lv-inbox-reply">
                    <span>
                      Replied{r.sentBy ? ` by ${r.sentBy}` : ''}
                      {r.sentAt ? ` · ${when(r.sentAt)}` : ''}
                    </span>
                    <p>{r.message}</p>
                  </div>
                ))}
                <div className="lv-inbox-actions">
                  <ContactReplyButton
                    id={m.id}
                    firstName={m.firstName}
                    email={m.email}
                    original={quotedOriginal(m)}
                  />
                  <MessageHandledButton id={m.id} handled={Boolean(m.handled)} />
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="lv-muted">
          {show.key === 'open' ? 'No unanswered messages.' : 'No messages here.'}
        </p>
      )}
      {totalDocs > docs.length && (
        <p className="lv-muted">
          Showing the newest {docs.length} of {totalDocs}.
        </p>
      )}
    </Gutter>
  )
}
