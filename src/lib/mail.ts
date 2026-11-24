import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import nodemailer, { type Transport } from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'

import { cloudflareTransport } from './cloudflareTransport'
import { relayTransport } from './relayTransport'

// How email goes out, picked from env (the first one that's set up wins):
// 1. Cloudflare Email Sending (CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_EMAIL_TOKEN): HTTPS straight
//    to Cloudflare's API, no mailbox sign-in. Works on Railway (HTTPS only) and locally.
// 2. Email relay (EMAIL_RELAY_URL + EMAIL_RELAY_SECRET): HTTPS to the Cloudflare Worker in
//    email-relay/, which sends through Gmail SMTP. Kept as a fallback.
// 3. SMTP (SMTP_USER + SMTP_PASS), e.g. Gmail with an app password.
// 4. None: Payload logs emails to the console and the site records them as "skipped".
// Every email is sent from EMAIL_FROM (or SMTP_USER).
//
// With Cloudflare as the sender, the next option that's set up (relay, then SMTP) is kept as a
// backup: if Cloudflare can't send an email (outage, bad or revoked token, quota, suppressed
// address), the same email goes out through the backup instead (see withFailover). On Railway
// keep EMAIL_RELAY_URL/EMAIL_RELAY_SECRET set for this; SMTP itself is blocked there.
//
// Cloudflare sets its own Message-ID on each email; the others keep ours. Either way the ID
// that went out is the `messageId` that payload.sendEmail() returns, so that's what we save
// for threading replies (see sentMessageId).

export function emailMode(): 'cloudflare' | 'relay' | 'smtp' | null {
  if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_EMAIL_TOKEN && senderAddress())
    return 'cloudflare'
  if (process.env.EMAIL_RELAY_URL && process.env.EMAIL_RELAY_SECRET && senderAddress())
    return 'relay'
  if (process.env.SMTP_USER && process.env.SMTP_PASS) return 'smtp'
  return null
}

/** The provider used when Cloudflare can't send an email (Cloudflare mode only). */
export function backupMode(): 'relay' | 'smtp' | null {
  if (emailMode() !== 'cloudflare') return null
  if (process.env.EMAIL_RELAY_URL && process.env.EMAIL_RELAY_SECRET) return 'relay'
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

/**
 * The Message-ID an email actually went out with, from payload.sendEmail()'s result. Falls back
 * to the ID we asked for (SMTP and the relay keep it) if the transport didn't report one.
 */
export function sentMessageId(info: unknown, requested?: string | null): string | null {
  const id = (info as { messageId?: unknown } | null | undefined)?.messageId
  return typeof id === 'string' && id ? id : (requested ?? null)
}

/**
 * Whether `address` was left out of a sent email (e.g. a Bcc copy Cloudflare couldn't deliver).
 * The customer's own address never shows up here: missing them makes the send throw instead.
 */
export function missedRecipient(info: unknown, address?: string | null) {
  const rejected = (info as { rejected?: unknown } | null | undefined)?.rejected
  return Array.isArray(rejected) && rejected.some((a) => same(String(a), address))
}

/** The backup provider's name when the email went out through it because Cloudflare failed. */
export function sentThroughBackup(info: unknown): string | null {
  const backup = (info as { backup?: unknown } | null | undefined)?.backup
  return typeof backup === 'string' ? backup : null
}

function smtpOptions(): SMTPTransport.Options {
  const port = Number(process.env.SMTP_PORT || 465)
  return {
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
  }
}

const relay = () =>
  relayTransport({
    url: process.env.EMAIL_RELAY_URL!,
    secret: process.env.EMAIL_RELAY_SECRET!,
    sender: senderAddress(),
  })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTransport = Transport<any>

/**
 * Tries `primary`; when it fails in a way another provider could fix (error.failover), sends
 * the same email through `backup`. Gmail (relay/SMTP) keeps the Message-ID we asked for, so
 * the returned messageId is still the one that went out. The result gets `backup: <name>`.
 */
export function withFailover(
  primary: AnyTransport,
  backup: AnyTransport | null,
  backupName: string,
): AnyTransport {
  const sendWith = (t: AnyTransport, mail: Parameters<AnyTransport['send']>[0]) =>
    new Promise<Record<string, unknown>>((resolve, reject) =>
      t.send(mail, (error, info) => (error ? reject(error) : resolve(info))),
    )
  return {
    name: `${primary.name}+failover`,
    version: '1.0.0',
    send(mail, callback) {
      sendWith(primary, mail)
        .catch(async (error: Error & { failover?: boolean }) => {
          if (!backup || !error.failover) throw error
          console.warn(`Email: ${error.message}; sending through the ${backupName} instead.`)
          try {
            const info = await sendWith(backup, mail)
            return { ...info, backup: backupName, primaryError: error.message }
          } catch (backupError) {
            throw new Error(
              `${error.message} | Backup (${backupName}) also failed: ${(backupError as Error).message}`,
            )
          }
        })
        .then(
          (info) => callback(null, info),
          (error: Error) => callback(error, undefined),
        )
    },
  }
}

export function emailAdapter() {
  const mode = emailMode()
  const base = {
    defaultFromAddress: senderAddress(),
    defaultFromName: fromName(),
    // Nothing to check at startup; each email reports its own result. (Payload's SMTP check
    // held up the whole admin for ~2 minutes where SMTP is blocked, on Railway Hobby.)
    skipVerify: true,
  }
  if (mode === 'cloudflare') {
    const backup = backupMode()
    return nodemailerAdapter({
      ...base,
      transport: nodemailer.createTransport(
        withFailover(
          cloudflareTransport({
            accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
            apiToken: process.env.CLOUDFLARE_EMAIL_TOKEN!,
            sender: senderAddress(),
          }),
          backup === 'relay'
            ? relay()
            : backup === 'smtp'
              ? new SMTPTransport(smtpOptions())
              : null,
          backup === 'relay' ? 'email relay' : 'SMTP',
        ),
      ),
    })
  }
  if (mode === 'relay') {
    return nodemailerAdapter({ ...base, transport: nodemailer.createTransport(relay()) })
  }
  if (mode === 'smtp') {
    return nodemailerAdapter({ ...base, transportOptions: smtpOptions() })
  }
  return undefined
}

const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  )

export { escapeHtml }
