'use server'

import { getPayload } from 'payload'

import config from '@/payload.config'
import { sendContactConfirmation } from '@/lib/contactReplies'
import type { ContactMessage } from '@/payload-types'
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
  let saved: ContactMessage
  try {
    saved = await payload.create({
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

  // The visitor's copy, Bcc'd to the restaurant: one conversation for both
  await sendContactConfirmation(payload, saved).catch((error) =>
    console.error('Contact form: emails failed', error),
  )
  return { status: 'success' }
}
