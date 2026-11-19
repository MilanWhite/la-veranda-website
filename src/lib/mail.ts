import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

// Email goes out through SMTP (Gmail with an app password for now). Without SMTP settings,
// Payload logs emails to the console and the site records them as "skipped".

export function isEmailConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS)
}

export function emailAdapter() {
  if (!isEmailConfigured()) return undefined
  const port = Number(process.env.SMTP_PORT || 465)
  return nodemailerAdapter({
    defaultFromAddress: process.env.EMAIL_FROM || process.env.SMTP_USER!,
    defaultFromName: process.env.EMAIL_FROM_NAME || 'La Veranda Restaurant',
    transportOptions: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        // Google shows app passwords in groups of four; spaces aren't part of it.
        pass: process.env.SMTP_PASS?.replace(/\s+/g, ''),
      },
    },
  })
}

const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  )

export { escapeHtml }
