/**
 * Checks the email setup by sending one test email.
 *   npm run check:email -- you@example.com
 * Shows how email is sent (email relay or SMTP), from which address, and the result.
 */
import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../src/payload.config'
import { emailMode, senderAddress } from '../src/lib/mail'

// `payload run` keeps its own arguments in argv, so look for the address
const to = process.argv.slice(2).find((arg) => arg.includes('@'))
if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
  console.error('Usage: npm run check:email -- you@example.com')
  process.exit(1)
}

const mode = emailMode()
if (!mode) {
  console.log(
    'Email is not set up (no EMAIL_RELAY_URL/EMAIL_RELAY_SECRET, no SMTP_USER/SMTP_PASS).',
  )
  process.exit(1)
}
console.log(`Sending with: ${mode === 'relay' ? 'email relay' : 'SMTP'}, from ${senderAddress()}`)

const payload = await getPayload({ config })
try {
  const info = (await payload.sendEmail({
    to,
    subject: 'La Veranda website: test email',
    text: 'This is a test email from the La Veranda website. If you got it, email works.',
    html: '<p>This is a test email from the La Veranda website. If you got it, email works.</p>',
  })) as { messageId?: string }
  console.log(`Sent to ${to}. Message-ID ${info?.messageId ?? '?'}`)
  process.exit(0)
} catch (error) {
  console.error('Failed:', (error as Error).message)
  process.exit(1)
}
