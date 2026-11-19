'use server'

import { getPayload } from 'payload'

import config from '@/payload.config'
import { escapeHtml, isEmailConfigured } from '@/lib/mail'
import { verifyTurnstile } from '@/lib/turnstile'
import { clientIp, isRateLimited } from '../lib/rateLimit'

export type ContactField = 'firstName' | 'lastName' | 'email' | 'phone' | 'message'
export type ContactFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Partial<Record<ContactField, string>>
  values?: Partial<Record<ContactField, string>>
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE = /^[\d\s()+.-]{7,20}$/

// "Let's Talk" form on /contact. Validates on the server, ignores bots (honeypot), limits
// each visitor to 5 messages per 10 minutes, then saves the message for the admin inbox.
// Then emails the restaurant (Reply-To = the sender). A failed email never loses the message.
export async function sendContactMessage(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const get = (name: string) => String(formData.get(name) ?? '').trim()
  // One-line fields: line breaks and control characters become spaces (names go into the
  // email subject). The message keeps its line breaks.
  const line = (name: string) => get(name).replace(/[\u0000-\u001f\u007f]+/g, ' ')
  const values = {
    firstName: line('firstName'),
    lastName: line('lastName'),
    email: line('email'),
    phone: line('phone'),
    message: get('message'),
  }

  // Honeypot: real visitors never see or fill this field.
  if (get('website')) return { status: 'success' }

  const errors: ContactFormState['errors'] = {}
  if (!values.firstName) errors.firstName = 'Please enter your first name.'
  else if (values.firstName.length > 100) errors.firstName = 'Please shorten your first name.'
  if (values.lastName.length > 100) errors.lastName = 'Please shorten your last name.'
  if (!EMAIL.test(values.email) || values.email.length > 200)
    errors.email = 'Please enter a valid email address.'
  if (values.phone && !PHONE.test(values.phone)) errors.phone = 'Please enter a valid phone number.'
  if (values.message.length < 10) errors.message = 'Please write a little more (10+ characters).'
  else if (values.message.length > 5000) errors.message = 'Please keep it under 5,000 characters.'

  if (Object.keys(errors).length) {
    return { status: 'error', message: 'Please check the highlighted fields.', errors, values }
  }

  const ip = await clientIp()
  if (isRateLimited(`contact:${ip}`, 5, 10 * 60 * 1000)) {
    return {
      status: 'error',
      message: 'Too many messages in a short time. Please try again later, or call us.',
      values,
    }
  }

  if (!(await verifyTurnstile(get('cf-turnstile-response'), ip))) {
    return { status: 'error', message: 'Please complete the spam check and try again.', values }
  }

  const payload = await getPayload({ config })
  try {
    await payload.create({
      collection: 'contact-messages',
      data: { ...values, handled: false },
      overrideAccess: true,
    })
  } catch (error) {
    console.error('Contact form: could not save message', error)
    return {
      status: 'error',
      message: 'Sorry, your message could not be sent. Please email or call us instead.',
      values,
    }
  }

  await notifyRestaurant(payload, values).catch((error) =>
    console.error('Contact form: email to restaurant failed', error),
  )
  return { status: 'success' }
}

async function notifyRestaurant(
  payload: Awaited<ReturnType<typeof getPayload>>,
  v: Record<ContactField, string>,
) {
  if (!isEmailConfigured()) return
  const settings = await payload.findGlobal({
    slug: 'site-settings',
    depth: 0,
    overrideAccess: true,
  })
  const to = (settings.internal?.notificationEmails ?? []).map((e) => e.email).filter(Boolean)
  if (!to.length && settings.email) to.push(settings.email)
  if (!to.length) return
  const name = [v.firstName, v.lastName].filter(Boolean).join(' ')
  const row = (label: string, value: string) =>
    value
      ? `<tr><td style="padding:8px 12px;font-weight:bold;border-bottom:1px solid #e5e7eb">${label}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${escapeHtml(value).replace(/\n/g, '<br>')}</td></tr>`
      : ''
  await payload.sendEmail({
    to: to.join(', '),
    replyTo: v.email,
    subject: `New message from ${name} (website contact form)`,
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#333"><p>New message from the La Veranda website. Reply to this email to answer ${escapeHtml(name)} directly.</p><table style="border-collapse:collapse">${row('Name', name)}${row('Email', v.email)}${row('Phone', v.phone)}${row('Message', v.message)}</table></div>`,
  })
}
