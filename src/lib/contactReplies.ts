import { randomUUID } from 'crypto'
import type { Endpoint, Payload } from 'payload'

import type { ContactMessage } from '../payload-types'
import {
  escapeHtml,
  isEmailConfigured,
  messageIdDomain,
  missedRecipient,
  replyToUnlessSender,
  sentMessageId,
  sentThroughBackup,
  splitRestaurantRecipients,
} from './mail'

// "Let's Talk" contact messages as one email conversation. When a visitor writes, they get a
// copy of their message ("we received it"), Bcc'd to the restaurant's mailbox (booking@), so
// both sides start from the same email. Replies from the admin, from Gmail or from the
// visitor all thread onto it (In-Reply-To/References). The admin shows the original message
// next to the reply box (quotedOriginal); the email itself doesn't repeat it.

// Each conversation needs its own subject: Gmail groups emails with the same subject into one
// thread, which would merge different visitors' conversations in the restaurant's mailbox.
// The full name and the day keep them apart (the same full name on the same day is almost
// always the same person writing again).
const day = (iso: string) =>
  new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Toronto',
  }).format(new Date(iso))
const fullName = (m: Pick<ContactMessage, 'firstName' | 'lastName'>) =>
  [m.firstName, m.lastName].filter(Boolean).join(' ')
export const contactSubject = (m: Pick<ContactMessage, 'firstName' | 'lastName' | 'createdAt'>) =>
  `Your message to La Veranda (${fullName(m)}, ${day(m.createdAt)})`

const json = (body: unknown, status = 200) => Response.json(body, { status })

const newMessageId = () => `<contact-reply.${randomUUID()}@${messageIdDomain()}>`

/** The ID we ask for on the first email, derived from the message itself. */
const requestedConfirmationId = (m: Pick<ContactMessage, 'id' | 'createdAt'>) =>
  `<contact-message.${m.id}.${Date.parse(m.createdAt)}@${messageIdDomain()}>`

/**
 * The first email's real ID, which replies point to. Saved when it's sent (Cloudflare picks its
 * own ID); messages from before that was saved went out through Gmail, which kept ours.
 */
export const contactConfirmationId = (
  m: Pick<ContactMessage, 'id' | 'createdAt' | 'confirmationMessageId'>,
) => m.confirmationMessageId || requestedConfirmationId(m)

const row = (label: string, value?: string | null) =>
  value
    ? `<tr><td style="padding:8px 12px;font-weight:bold;border-bottom:1px solid #e5e7eb;vertical-align:top">${label}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${escapeHtml(value).replace(/\n/g, '<br>')}</td></tr>`
    : ''

type EmailStatus = 'sent' | 'failed' | 'skipped'

/**
 * Sent when the visitor writes: their copy, Bcc'd to the restaurant's mailbox, plus a
 * notification to any other restaurant address. The result is saved on the message, so a
 * failure shows in the admin inbox and on the dashboard. Never throws.
 */
export async function sendContactConfirmation(payload: Payload, m: ContactMessage) {
  let visitor: EmailStatus = 'skipped'
  let restaurant: EmailStatus = 'skipped'
  const errors: string[] = []
  try {
    if (isEmailConfigured()) {
      ;({ visitor, restaurant } = await sendContactEmails(payload, m, errors))
    }
  } catch (error) {
    errors.push((error as Error).message)
  }
  await payload
    .update({
      collection: 'contact-messages',
      id: m.id,
      overrideAccess: true,
      data: { emails: { visitor, restaurant, error: errors.join(' | ') || null } },
    })
    .catch((error) => console.error('Contact form: could not save the email result', error))
  return { visitor, restaurant, errors }
}

async function sendContactEmails(payload: Payload, m: ContactMessage, errors: string[]) {
  const settings = await payload.findGlobal({
    slug: 'site-settings',
    depth: 0,
    overrideAccess: true,
  })
  const owners = (settings.internal?.notificationEmails ?? []).map((e) => e.email).filter(Boolean)
  if (!owners.length && settings.email) owners.push(settings.email)
  const { mailbox, others } = splitRestaurantRecipients(owners)
  const name = fullName(m)
  const table = `<table style="border-collapse:collapse">${row('Name', name)}${row('Email', m.email)}${row('Phone', m.phone)}${row('Message', m.message)}</table>`

  let visitor: EmailStatus = 'failed'
  // booking@ hears about it through the Bcc; otherwise through the notification below
  let restaurant: EmailStatus = 'skipped'
  let mailboxReached = false
  let confirmationMessageId: string | null = null
  try {
    const requested = requestedConfirmationId(m)
    const info = await payload.sendEmail({
      to: m.email,
      ...(mailbox ? { bcc: mailbox } : {}),
      replyTo: replyToUnlessSender(settings.internal?.replyFromEmail || settings.email),
      subject: contactSubject(m),
      messageId: requested,
      html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222"><p>Hi ${escapeHtml(m.firstName)},</p><p>Thank you for your message. We’ve received it and will get back to you as soon as we can. You can reply to this email to add anything.</p>${table}<p>The La Veranda Team</p></div>`,
    })
    visitor = 'sent'
    confirmationMessageId = sentMessageId(info, requested)
    // The Bcc copy can be left out (e.g. booking@ on Cloudflare's suppression list); then the
    // restaurant gets the separate notification below instead
    mailboxReached = Boolean(mailbox) && !missedRecipient(info, mailbox)
    if (mailboxReached) restaurant = 'sent'
    else if (mailbox) errors.push(`Copy to ${mailbox} (Bcc) was not delivered`)
    const backup = sentThroughBackup(info)
    if (backup) errors.push(`Copy to visitor sent through the ${backup} (Cloudflare failed)`)
  } catch (error) {
    console.error('Contact form: email to the visitor failed', error)
    errors.push(`Copy to visitor: ${(error as Error).message}`)
  }

  // Save the ID the email went out with (Cloudflare picks its own) so replies thread onto it
  if (confirmationMessageId) {
    await payload
      .update({
        collection: 'contact-messages',
        id: m.id,
        overrideAccess: true,
        data: { confirmationMessageId },
      })
      .catch((error) => console.error('Contact form: saving the email ID failed', error))
  }

  // Other addresses, and the restaurant's mailbox if its Bcc copy didn't arrive
  const notify = [...others, ...(mailbox && !mailboxReached ? [mailbox] : [])]
  if (notify.length) {
    try {
      const info = await payload.sendEmail({
        to: notify.join(', '),
        replyTo: m.email,
        subject: `New message from ${name} (website contact form)`,
        html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#333"><p>New message from the La Veranda website. Reply to this email to answer ${escapeHtml(name)} directly.</p>${table}</div>`,
      })
      restaurant = 'sent'
      const backup = sentThroughBackup(info)
      if (backup)
        errors.push(`Restaurant notification sent through the ${backup} (Cloudflare failed)`)
    } catch (error) {
      console.error('Contact form: email to the restaurant failed', error)
      restaurant = 'failed'
      errors.push(`Restaurant notification: ${(error as Error).message}`)
    }
  }
  return { visitor, restaurant }
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
  const requested = newMessageId()

  // No quote of the visitor's message: it's already the first email of this conversation
  // (their copy), so email apps show it just above the reply.
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222">${escapeHtml(
    message,
  ).replace(/\n/g, '<br>')}</div>`

  const info = await payload.sendEmail({
    to: m.email,
    replyTo: replyToUnlessSender(settings.internal?.replyFromEmail || settings.email),
    subject: `Re: ${contactSubject(m)}`,
    messageId: requested,
    inReplyTo: earlier.at(-1),
    references: earlier,
    text: message,
    html,
  })
  // The next reply points to this one, so save the ID it actually went out with
  const messageId = sentMessageId(info, requested)

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
