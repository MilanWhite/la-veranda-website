import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import nodemailer from 'nodemailer'

import { relayTransport } from './relayTransport'

// How email goes out, picked from env:
// 1. Email relay (EMAIL_RELAY_URL + EMAIL_RELAY_SECRET): HTTPS to the Cloudflare Worker in
//    email-relay/, which sends through Gmail SMTP. Used on Railway, which blocks SMTP on Hobby.
// 2. SMTP (SMTP_USER + SMTP_PASS), e.g. Gmail with an app password. Used locally.
// 3. Neither: Payload logs emails to the console and the site records them as "skipped".
// Either way every email is sent from EMAIL_FROM (or SMTP_USER).

export function emailMode(): 'relay' | 'smtp' | null {
  if (process.env.EMAIL_RELAY_URL && process.env.EMAIL_RELAY_SECRET && senderAddress())
    return 'relay'
  if (process.env.SMTP_USER && process.env.SMTP_PASS) return 'smtp'
  return null
}

export function isEmailConfigured() {
  return emailMode() !== null
}

/** The address every email is sent from. */
export function senderAddress() {
  return (process.env.EMAIL_FROM || process.env.SMTP_USER || '').trim()
}

/** Domain for the IDs we give emails (so replies can point back to them). */
export function messageIdDomain() {
  return senderAddress().split('@')[1] || 'localhost'
}

const same = (a?: string | null, b?: string | null) =>
  Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase())

/**
 * Splits the restaurant's notification addresses into the mailbox the site sends from
 * (booking@) and any others. The sending mailbox is Bcc'd on the customer's email, so both
 * sides share one conversation; other addresses get a separate notification.
 */
export function splitRestaurantRecipients(addresses: string[]) {
  const sender = senderAddress()
  return {
    mailbox: addresses.some((a) => same(a, sender)) ? sender : null,
    others: addresses.filter((a) => !same(a, sender)),
  }
}

/** Reply-To, left out when it's the sending mailbox itself (From already says that). */
export function replyToUnlessSender(address?: string | null) {
  return address && !same(address, senderAddress()) ? address : undefined
}

const fromName = () => process.env.EMAIL_FROM_NAME || 'La Veranda Restaurant'

export function emailAdapter() {
  const mode = emailMode()
  if (mode === 'relay') {
    return nodemailerAdapter({
      defaultFromAddress: senderAddress(),
      defaultFromName: fromName(),
      // Nothing to check at startup; each email reports its own result.
      skipVerify: true,
      transport: nodemailer.createTransport(
        relayTransport({
          url: process.env.EMAIL_RELAY_URL!,
          secret: process.env.EMAIL_RELAY_SECRET!,
          sender: senderAddress(),
        }),
      ),
    })
  }
  if (mode === 'smtp') {
    const port = Number(process.env.SMTP_PORT || 465)
    return nodemailerAdapter({
      defaultFromAddress: senderAddress(),
      defaultFromName: fromName(),
      // Payload's startup check waits for the SMTP server; where SMTP is blocked (Railway
      // Hobby) that held up the whole admin for ~2 minutes. Failures show per email instead.
      skipVerify: true,
      transportOptions: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port,
        secure: port === 465,
        auth: {
          user: process.env.SMTP_USER,
          // Google shows app passwords in groups of four; spaces aren't part of it.
          pass: process.env.SMTP_PASS?.replace(/\s+/g, ''),
        },
        // Fail in seconds rather than minutes when the server can't be reached
        connectionTimeout: 15_000,
        greetingTimeout: 15_000,
        socketTimeout: 30_000,
      },
    })
  }
  return undefined
}

const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  )

export { escapeHtml }
