'use client'

import { useActionState } from 'react'

import { type ContactField, type ContactFormState, sendContactMessage } from './actions'

const initialState: ContactFormState = { status: 'idle' }

function Field({
  name,
  label,
  state,
  type = 'text',
  required = false,
  autoComplete,
  textarea = false,
}: {
  name: ContactField
  label: string
  state: ContactFormState
  type?: string
  required?: boolean
  autoComplete?: string
  textarea?: boolean
}) {
  const error = state.errors?.[name]
  const props = {
    id: `contact-${name}`,
    name,
    required,
    autoComplete,
    defaultValue: state.values?.[name],
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `contact-${name}-error` : undefined,
  }
  return (
    <div className={`form-field${textarea ? ' form-field-wide' : ''}`}>
      <label htmlFor={props.id}>
        {label}
        {!required && <span className="optional"> (optional)</span>}
      </label>
      {textarea ? <textarea rows={6} {...props} /> : <input type={type} {...props} />}
      {error && (
        <p id={`contact-${name}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}

export function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContactMessage, initialState)

  if (state.status === 'success') {
    return (
      <div className="form-success" role="status">
        <h3>Thank you!</h3>
        <p>Your message has been sent. We’ll get back to you as soon as we can.</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="contact-form" noValidate>
      <div className="form-grid">
        <Field
          name="firstName"
          label="First Name"
          state={state}
          required
          autoComplete="given-name"
        />
        <Field name="lastName" label="Last Name" state={state} autoComplete="family-name" />
        <Field
          name="email"
          label="Email"
          type="email"
          state={state}
          required
          autoComplete="email"
        />
        <Field name="phone" label="Phone Number" type="tel" state={state} autoComplete="tel" />
        <Field name="message" label="Message" state={state} required textarea />
      </div>

      {/* Honeypot for bots: hidden from people and screen readers. */}
      <div className="hp" aria-hidden>
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {state.status === 'error' && state.message && (
        <p className="form-error" role="alert">
          {state.message}
        </p>
      )}

      <button type="submit" className="button-solid" disabled={pending}>
        {pending ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  )
}
