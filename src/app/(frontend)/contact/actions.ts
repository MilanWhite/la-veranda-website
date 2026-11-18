'use server'

import { getPayload } from 'payload'

import config from '@/payload.config'
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
// TODO (Stage 10): also email the restaurant once an email account is configured, and add
// Cloudflare Turnstile.
export async function sendContactMessage(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const get = (name: string) => String(formData.get(name) ?? '').trim()
  const values = {
    firstName: get('firstName'),
    lastName: get('lastName'),
    email: get('email'),
    phone: get('phone'),
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

  if (isRateLimited(`contact:${await clientIp()}`, 5, 10 * 60 * 1000)) {
    return {
      status: 'error',
      message: 'Too many messages in a short time. Please try again later, or call us.',
      values,
    }
  }

  try {
    const payload = await getPayload({ config })
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

  return { status: 'success' }
}
