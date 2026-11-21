import { randomUUID } from 'crypto'
import type { Endpoint, Payload } from 'payload'

import type { ContactMessage } from '../payload-types'
import {
  escapeHtml,
  isEmailConfigured,
  messageIdDomain,
  replyToUnlessSender,
  splitRestaurantRecipients,
} from './mail'

// "Let's Talk" contact messages as one email conversation. When a visitor writes, they get a
// copy of their message ("we received it"), Bcc'd to the restaurant's mailbox (booking@), so
// both sides start from the same email. Replies from the admin, from Gmail or from the
// visitor all thread onto it (In-Reply-To/References). The admin shows the original message
// next to the reply box (quotedOriginal); the email itself doesn't repeat it.

// Each conversation needs its own subject: Gmail groups emails with the same subject into one
// thread, which would merge different visitors' conversations in the restaurant's mailbox.
const day = (iso: string) =>
  new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Toronto',
  }).format(new Date(iso))
export const contactSubject = (m: Pick<ContactMessage, 'firstName' | 'createdAt'>) =>
  `Your message to La Veranda (${m.firstName}, ${day(m.createdAt)})`

const json = (body: unknown, status = 200) => Response.json(body, { status })

const newMessageId = () => `<contact-reply.${randomUUID()}@${messageIdDomain()}>`

/** The first email's ID, derived from the message itself so replies can always point to it. */
export const contactConfirmationId = (m: Pick<ContactMessage, 'id' | 'createdAt'>) =>
  `<contact-message.${m.id}.${Date.parse(m.createdAt)}@${messageIdDomain()}>`

const row = (label: string, value?: string | null) =>
  value
    ? `<tr><td style="padding:8px 12px;font-weight:bold;border-bottom:1px solid #e5e7eb;vertical-align:top">${label}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${escapeHtml(value).replace(/\n/g, '<br>')}</td></tr>`
    : ''

/** Sent when the visitor writes: their copy, Bcc'd to the restaurant's mailbox. */
export async function sendContactConfirmation(payload: Payload, m: ContactMessage) {
  if (!isEmailConfigured()) return
  const settings = await payload.findGlobal({
    slug: 'site-settings',
    depth: 0,
    overrideAccess: true,
  })
  const owners = (settings.internal?.notificationEmails ?? []).map((e) => e.email).filter(Boolean)
  if (!owners.length && settings.email) owners.push(settings.email)
  const { mailbox, others } = splitRestaurantRecipients(owners)
  const name = [m.firstName, m.lastName].filter(Boolean).join(' ')
  const table = `<table style="border-collapse:collapse">${row('Name', name)}${row('Email', m.email)}${row('Phone', m.phone)}${row('Message', m.message)}</table>`

  let sent = false
  try {
    await payload.sendEmail({
      to: m.email,
      ...(mailbox ? { bcc: mailbox } : {}),
      replyTo: replyToUnlessSender(settings.internal?.replyFromEmail || settings.email),
      subject: contactSubject(m),
      messageId: contactConfirmationId(m),
      html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222"><p>Hi ${escapeHtml(m.firstName)},</p><p>Thank you for your message. We’ve received it and will get back to you as soon as we can. You can reply to this email to add anything.</p>${table}<p>The La Veranda Team</p></div>`,
    })
    sent = true
  } catch (error) {
    console.error('Contact form: email to the visitor failed', error)
  }

  // Other addresses, and the restaurant's mailbox if the visitor's email failed
  const notify = [...others, ...(mailbox && !sent ? [mailbox] : [])]
  if (notify.length) {
    await payload
      .sendEmail({
        to: notify.join(', '),
        replyTo: m.email,
        subject: `New message from ${name} (website contact form)`,
        html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#333"><p>New message from the La Veranda website. Reply to this email to answer ${escapeHtml(name)} directly.</p>${table}</div>`,
      })
      .catch((error) => console.error('Contact form: email to the restaurant failed', error))
  }
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
  // The visitor's first email, then every earlier reply: one conversation
  const earlier = [
    contactConfirmationId(m),
    ...(m.replies ?? []).map((r) => r.messageId).filter((id): id is string => !!id),
  ]
  const messageId = newMessageId()

  // No quote of the visitor's message: it's already the first email of this conversation
  // (their copy), so email apps show it just above the reply.
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222">${escapeHtml(
    message,
  ).replace(/\n/g, '<br>')}</div>`

  await payload.sendEmail({
    to: m.email,
    replyTo: replyToUnlessSender(settings.internal?.replyFromEmail || settings.email),
    subject: `Re: ${contactSubject(m)}`,
    messageId,
    inReplyTo: earlier.at(-1),
    references: earlier,
    text: message,
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
