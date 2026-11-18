import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'
import type { Payload } from 'payload'

import type { EventRequest } from '../../payload-types'
import { escapeHtml, isEmailConfigured } from '../mail'
import { renderBookingPdf, pdfFilename } from './pdf'
import { formatDate, formatTime, requestNotes, summaryRows } from './summary'

// Sends the customer confirmation and the restaurant notification, each with the PDF,
// then records the result on the request. A failed email never removes the request.

// The customer's confirmation and every reply from the admin share this subject (replies add
// "Re:"), so they show as one conversation for the customer and in the restaurant's Sent mail.
export const conversationSubject = (r: EventRequest) =>
  `Your event request #${r.requestNumber} at La Veranda`

// A new email ID for each confirmation sent (a resend must not reuse one: Gmail drops
// emails whose ID it has already seen). Replies point to it.
function newMessageId() {
  const domain =
    (process.env.EMAIL_FROM || process.env.SMTP_USER || '').split('@')[1] || 'localhost'
  return `<event-request.${randomUUID()}@${domain}>`
}

const logoAttachment = () => ({
  filename: 'la-veranda.png',
  content: fs.readFileSync(path.join(process.cwd(), 'src/assets/logo-dark.png')),
  cid: 'la-veranda-logo',
})

function table(r: EventRequest) {
  return summaryRows(r)
    .map(
      (row) => `<tr>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-weight:bold;width:38%;vertical-align:top;color:#111827">${escapeHtml(row.label)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;vertical-align:top;color:#333">${escapeHtml(row.value).replace(/\n/g, '<br>')}</td>
      </tr>`,
    )
    .join('')
}

function notesList(r: EventRequest) {
  const notes = requestNotes(r)
  if (!notes.length) return ''
  return `<h3 style="margin:28px 0 8px;font-size:16px;color:#111827">Pricing &amp; Notes</h3>
    <ul style="margin:0;padding-left:20px;color:#333;line-height:1.6">
      ${notes
        .map((n) => {
          const i = n.indexOf(':')
          return i > 0
            ? `<li><strong>${escapeHtml(n.slice(0, i + 1))}</strong>${escapeHtml(n.slice(i + 1))}</li>`
            : `<li>${escapeHtml(n)}</li>`
        })
        .join('')}
    </ul>
    <p style="margin:10px 0 0;font-size:12px;color:#6b7280">Note: Exact totals depend on final guest counts, menu selections, and duration.</p>`
}

function layout(inner: string) {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;font-size:15px">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;padding:32px">
    <div style="text-align:center;margin-bottom:24px"><img src="cid:la-veranda-logo" alt="La Veranda" width="200" style="width:200px;height:auto"></div>
    ${inner}
    <p style="margin:32px 0 0;text-align:center;font-size:12px;color:#6b7280">© ${new Date().getFullYear()} La Veranda Restaurant. All rights reserved.</p>
  </div></body></html>`
}

export function customerEmailHtml(r: EventRequest) {
  return layout(`
    <h1 style="margin:0 0 12px;font-size:24px;color:#111827">Thank You For Your Request</h1>
    <p style="margin:0 0 20px;color:#333;line-height:1.6">We have received your event booking request #${r.requestNumber}. We will review the details and send you a quotation shortly. <strong>This does not confirm your booking.</strong> Here is a summary of your submission (also attached as a PDF):</p>
    <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px">${table(r)}</table>
    ${notesList(r)}
    <p style="margin:24px 0 0;color:#333">If you have any questions, please reply to this email.</p>`)
}

// The restaurant's copy. Replying to it goes straight to the customer (Reply-To), and the
// email app quotes it in the reply, so it must read well to the customer too: a plain
// booking summary, with no admin links or notes meant only for staff. Staff open the
// request from the admin dashboard (newest pending requests are at the top).
export function ownerEmailHtml(r: EventRequest) {
  return layout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#111827">Event Request #${r.requestNumber}</h1>
    <p style="margin:0 0 20px;color:#333;line-height:1.6">
      <strong>${escapeHtml(r.event.type)}</strong> on <strong>${escapeHtml(formatDate(r.event.date))}</strong>,
      ${escapeHtml(formatTime(r.event.startTime))} – ${escapeHtml(formatTime(r.event.endTime))},
      ${r.event.adults} guests${r.event.kids ? ` + ${r.event.kids} kids` : ''}.
    </p>
    <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px">${table(r)}</table>
    ${notesList(r)}`)
}

type Status = 'sent' | 'failed' | 'skipped'

export async function sendRequestEmails(payload: Payload, request: EventRequest) {
  const settings = await payload.findGlobal({
    slug: 'site-settings',
    depth: 0,
    overrideAccess: true,
  })
  const ownerEmails = (settings.internal?.notificationEmails ?? [])
    .map((e) => e.email)
    .filter(Boolean)
  if (!ownerEmails.length && settings.email) ownerEmails.push(settings.email)

  let customer: Status = 'skipped'
  let messageId: string | null = null
  let owner: Status = 'skipped'
  const errors: string[] = []

  if (isEmailConfigured()) {
    let pdf: Buffer | null = null
    try {
      pdf = await renderBookingPdf(request)
    } catch (error) {
      errors.push(`PDF: ${(error as Error).message}`)
    }
    const attachments = [
      logoAttachment(),
      ...(pdf ? [{ filename: pdfFilename(request), content: pdf }] : []),
    ]
    try {
      messageId = newMessageId()
      await payload.sendEmail({
        to: request.customer.email,
        // Customer replies go to the mailbox that the admin's replies come from
        replyTo: settings.internal?.replyFromEmail || settings.email || undefined,
        subject: conversationSubject(request),
        messageId,
        html: customerEmailHtml(request),
        attachments,
      })
      customer = 'sent'
    } catch (error) {
      customer = 'failed'
      errors.push(`Customer email: ${(error as Error).message}`)
    }

    if (ownerEmails.length) {
      try {
        await payload.sendEmail({
          to: ownerEmails.join(', '),
          replyTo: request.customer.email,
          // Reads naturally to the customer as "Re: …" when staff reply
          subject: `Event request #${request.requestNumber}: ${request.event.type} on ${formatDate(request.event.date)}`,
          html: ownerEmailHtml(request),
          attachments,
        })
        owner = 'sent'
      } catch (error) {
        owner = 'failed'
        errors.push(`Restaurant email: ${(error as Error).message}`)
      }
    }
  }

  const label = { sent: 'sent', failed: 'failed', skipped: 'skipped (email not set up)' }
  await payload.update({
    collection: 'event-requests',
    id: request.id,
    overrideAccess: true,
    context: {
      skipCalendar: true,
      activity: [
        `Confirmation email to customer ${label[customer]}`,
        `Notification email to restaurant ${label[owner]}`,
        ...errors.map((e) => `Email problem: ${e}`),
      ],
    },
    data: {
      emails: {
        customer,
        owner,
        sentAt: customer === 'sent' || owner === 'sent' ? new Date().toISOString() : null,
        error: errors.join(' | ') || null,
        // Keep the last delivered confirmation's ID so replies stay in its conversation
        confirmationMessageId:
          customer === 'sent' ? messageId : (request.emails?.confirmationMessageId ?? null),
      },
    },
  })
  return { customer, owner, errors }
}

// A reply written in the admin, sent as the restaurant to the customer. It's marked as a reply
// to the confirmation email (same subject with "Re:", plus In-Reply-To/References), so the
// customer's email app and the restaurant's Sent mail show one conversation. Recorded in History.
export async function sendCustomerReply(
  payload: Payload,
  request: EventRequest,
  { message, attachPdf, sentBy }: { message: string; attachPdf?: boolean; sentBy?: string },
) {
  if (!isEmailConfigured()) throw new Error('Email is not set up, so replies can’t be sent.')
  const settings = await payload.findGlobal({
    slug: 'site-settings',
    depth: 0,
    overrideAccess: true,
  })
  const original = request.emails?.confirmationMessageId || undefined
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222">${escapeHtml(
    message,
  ).replace(/\n/g, '<br>')}</div>`

  await payload.sendEmail({
    to: request.customer.email,
    replyTo: settings.internal?.replyFromEmail || settings.email || undefined,
    subject: `Re: ${conversationSubject(request)}`,
    messageId: newMessageId(),
    ...(original ? { inReplyTo: original, references: [original] } : {}),
    text: message,
    html,
    attachments: attachPdf
      ? [{ filename: pdfFilename(request), content: await renderBookingPdf(request) }]
      : [],
  })

  const firstLine = message
    .split('\n')
    .find((l) => l.trim() && !/^(hi|hello|dear)\b/i.test(l.trim()))
  await payload.update({
    collection: 'event-requests',
    id: request.id,
    overrideAccess: true,
    context: {
      skipCalendar: true,
      activity: [
        `Reply emailed to customer${sentBy ? ` by ${sentBy}` : ''}${attachPdf ? ' (with PDF)' : ''}: “${(firstLine ?? message).trim().slice(0, 120)}${(firstLine ?? message).trim().length > 120 ? '…' : ''}”`,
      ],
    },
    data: {},
  })
}
