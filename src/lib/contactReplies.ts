import { randomUUID } from 'crypto'
import type { Endpoint, Payload } from 'payload'

import type { ContactMessage } from '../payload-types'
import { escapeHtml, isEmailConfigured } from './mail'

// Replies to "Let's Talk" contact messages, sent from the admin inbox as the restaurant.
// The visitor never got an email when they wrote to us, so each reply quotes their original
// message underneath (like an email app does) to give them the context. Replies to the same
// person are linked (In-Reply-To/References), so they form one conversation.

export const CONTACT_REPLY_SUBJECT = 'Re: Your message to La Veranda'

const json = (body: unknown, status = 200) => Response.json(body, { status })

const newMessageId = () => {
  const domain =
    (process.env.EMAIL_FROM || process.env.SMTP_USER || '').split('@')[1] || 'localhost'
  return `<contact-reply.${randomUUID()}@${domain}>`
}

const when = (iso: string) =>
  new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Toronto',
  }).format(new Date(iso))

export function quotedOriginal(m: ContactMessage) {
  const name = [m.firstName, m.lastName].filter(Boolean).join(' ')
  return { header: `On ${when(m.createdAt)}, ${name} wrote:`, text: m.message }
}

export async function sendContactReply(
  payload: Payload,
  m: ContactMessage,
  { message, sentBy }: { message: string; sentBy?: string },
) {
  if (!isEmailConfigured()) throw new Error('Email is not set up, so replies can’t be sent.')
  const settings = await payload.findGlobal({
    slug: 'site-settings',
    depth: 0,
    overrideAccess: true,
  })
  const quote = quotedOriginal(m)
  const earlier = (m.replies ?? []).map((r) => r.messageId).filter((id): id is string => !!id)
  const messageId = newMessageId()

  const text = `${message}\n\n${quote.header}\n${quote.text
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n')}`
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222">
  <div>${escapeHtml(message).replace(/\n/g, '<br>')}</div>
  <p style="margin:24px 0 6px;color:#666;font-size:13px">${escapeHtml(quote.header)}</p>
  <blockquote style="margin:0;padding:4px 0 4px 12px;border-left:3px solid #ccc;color:#555">${escapeHtml(
    quote.text,
  ).replace(/\n/g, '<br>')}</blockquote>
</div>`

  await payload.sendEmail({
    to: m.email,
    replyTo: settings.internal?.replyFromEmail || settings.email || undefined,
    subject: CONTACT_REPLY_SUBJECT,
    messageId,
    ...(earlier.length ? { inReplyTo: earlier.at(-1), references: earlier } : {}),
    text,
    html,
  })

  await payload.update({
    collection: 'contact-messages',
    id: m.id,
    overrideAccess: true,
    data: {
      handled: true,
      replies: [
        ...(m.replies ?? []),
        { message, sentBy: sentBy ?? null, sentAt: new Date().toISOString(), messageId },
      ],
    },
  })
}

export const contactMessageEndpoints: Endpoint[] = [
  {
    path: '/:id/reply',
    method: 'post',
    handler: async (req) => {
      if (!req.user) return json({ error: 'Please sign in.' }, 401)
      let m: ContactMessage
      try {
        m = (await req.payload.findByID({
          collection: 'contact-messages',
          id: req.routeParams?.id as string,
          depth: 0,
          req,
        })) as ContactMessage
      } catch {
        return json({ error: 'Message not found.' }, 404)
      }
      const body = (req.json ? await req.json() : {}) as { message?: string }
      const message = String(body.message ?? '')
        .replace(/\r\n?/g, '\n')
        .trim()
      if (!message) return json({ error: 'Please write a message.' }, 400)
      if (message.length > 10_000) return json({ error: 'The message is too long.' }, 400)
      try {
        await sendContactReply(req.payload, m, { message, sentBy: req.user.email })
        return json({ ok: true })
      } catch (e) {
        return json({ error: (e as Error).message || 'Something went wrong.' }, 500)
      }
    },
  },
]
