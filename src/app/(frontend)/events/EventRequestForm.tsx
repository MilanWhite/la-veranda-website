'use client'

import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from 'react'

import { defaultChoices, extraLinks } from '@/lib/eventRequests/linkedExtras'
import { pricingNotes } from '@/lib/eventRequests/summary'
import type { EventMenu } from '@/payload-types'
import { Turnstile, type TurnstileHandle } from '../components/Turnstile'
import { type EventRequestState, submitEventRequest } from './actions'

const initial: EventRequestState = { status: 'idle' }

const money = (n?: number | null) => (n == null ? '' : `$${Number.isInteger(n) ? n : n.toFixed(2)}`)
const time12 = (t: string) => {
  const h = Number(t.slice(0, 2))
  return `${((h + 11) % 12) + 1}:${t.slice(3)} ${h < 12 ? 'AM' : 'PM'}`
}
const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
/** "12:00" + 4 h → "16:00" (wraps past midnight) */
const addHours = (t: string, hours: number) => {
  const m = (minutes(t) + hours * 60) % (24 * 60)
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}
const pickRule = (min?: number | null, max?: number | null) => {
  const lo = min ?? 0
  if (max && lo === max) return `Choose ${max} item${max === 1 ? '' : 's'}`
  if (max && lo) return `Choose ${lo} to ${max}`
  if (max) return `Choose up to ${max}`
  if (lo) return `Choose at least ${lo}`
  return ''
}

function FieldError({ id, error }: { id: string; error?: string }) {
  return error ? (
    <p id={`${id}-error`} className="field-error">
      {error}
    </p>
  ) : null
}

export function EventRequestForm({ menu, startTimes }: { menu: EventMenu; startTimes: string[] }) {
  const [state, formAction, pending] = useActionState(submitEventRequest, initial)
  const turnstile = useRef<TurnstileHandle>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Controlled values so nothing is lost if the server sends back errors.
  const [v, setV] = useState<Record<string, string>>({
    startTime: startTimes[0] ?? '',
    endTime: startTimes[0] ? addHours(startTimes[0], menu.includedHours) : '',
    kids: '0',
  })
  const [picked, setPicked] = useState<Record<string, string[]>>({})
  const [tbd, setTbd] = useState<Record<string, boolean>>({})
  const [extras, setExtras] = useState<string[]>([])
  const [choices, setChoices] = useState<Record<string, string>>(() => defaultChoices(menu))
  // e.g. the "Open Bar" extra and Alcohol → "Open Bar" move together (lib/eventRequests/linkedExtras)
  const links = useMemo(() => extraLinks(menu), [menu])

  const toggleExtra = (id: string) => {
    const on = !extras.includes(id)
    setExtras((p) => (on ? [...p, id] : p.filter((x) => x !== id)))
    for (const l of links.filter((l) => l.extraId === id)) {
      setChoices((p) =>
        on
          ? { ...p, [l.choiceKey]: l.optionId }
          : p[l.choiceKey] === l.optionId
            ? { ...p, [l.choiceKey]: l.offOptionId }
            : p,
      )
    }
  }
  const pickChoice = (key: string, optionId: string) => {
    setChoices((p) => ({ ...p, [key]: optionId }))
    for (const l of links.filter((l) => l.choiceKey === key)) {
      setExtras((p) =>
        l.optionId === optionId
          ? p.includes(l.extraId)
            ? p
            : [...p, l.extraId]
          : p.filter((x) => x !== l.extraId),
      )
    }
  }
  const [deposit, setDeposit] = useState(false)

  // The ending time follows the start time (start + included hours) until the customer
  // picks an ending time themselves.
  const [endTouched, setEndTouched] = useState(false)
  const setStart = (e: { target: { value: string } }) => {
    const startTime = e.target.value
    setV((prev) => ({
      ...prev,
      startTime,
      endTime: endTouched || !startTime ? prev.endTime : addHours(startTime, menu.includedHours),
    }))
  }
  const setEnd = (e: { target: { value: string } }) => {
    setEndTouched(true)
    setV((prev) => ({ ...prev, endTime: e.target.value }))
  }

  const set = (name: string) => (e: { target: { value: string } }) =>
    setV((prev) => ({ ...prev, [name]: e.target.value }))
  const err = state.errors ?? {}
  const kids = Number(v.kids || 0)

  // After a failed submit: new spam-check token, and scroll to the first problem.
  useEffect(() => {
    if (state.status !== 'error') return
    turnstile.current?.reset()
    const first = formRef.current?.querySelector('[aria-invalid="true"], .form-error')
    first?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [state])

  // After a successful submit the long form is replaced by a short message, which would
  // leave the page scrolled down near the footer: bring the "Event Contract" section back up.
  useEffect(() => {
    if (state.status !== 'success') return
    document.getElementById('book-an-event')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [state])

  const overtime = useMemo(() => {
    if (!v.startTime || !/^\d{2}:\d{2}$/.test(v.endTime ?? '')) return 0
    let d = minutes(v.endTime) - minutes(v.startTime)
    if (d <= 0) d += 24 * 60
    return Math.max(0, Math.ceil((d - menu.includedHours * 60) / 60))
  }, [v.startTime, v.endTime, menu.includedHours])

  if (state.status === 'success') {
    return (
      <div className="form-success paper" role="status">
        <h3>
          Thank you! Your event request has been received
          {state.requestNumber ? ` (#${state.requestNumber})` : ''}.
        </h3>
        <p>
          This does not confirm your booking. La Veranda will review your request and contact you
          with a quotation. A summary has been sent to your email.
        </p>
      </div>
    )
  }

  const toggle = (key: string, id: string, max?: number | null) =>
    setPicked((prev) => {
      const now = prev[key] ?? []
      if (now.includes(id)) return { ...prev, [key]: now.filter((x) => x !== id) }
      if (max && now.length >= max) return prev
      return { ...prev, [key]: [...now, id] }
    })

  const input = (name: string, extra: Record<string, unknown> = {}) => ({
    id: `er-${name}`,
    name,
    value: v[name] ?? '',
    onChange: set(name),
    'aria-invalid': err[name] ? true : undefined,
    'aria-describedby': err[name] ? `er-${name}-error` : undefined,
    ...extra,
  })

  return (
    <form
      ref={formRef}
      action={formAction}
      // Submit without React's automatic form reset, which would clear the menu choices,
      // event type and deposit box after a failed submit (they aren't kept in state).
      onSubmit={(e) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        startTransition(() => formAction(form))
      }}
      className="event-form paper"
      noValidate
    >
      {/* Contact */}
      <fieldset className="form-section">
        <legend>Your Details</legend>
        <div className="form-grid form-grid-3">
          <div className="form-field">
            <label htmlFor="er-nameOrCompany">Name / Company</label>
            <input {...input('nameOrCompany', { required: true, autoComplete: 'organization' })} />
            <FieldError id="er-nameOrCompany" error={err.nameOrCompany} />
          </div>
          <div className="form-field">
            <label htmlFor="er-contactPerson">
              Contact Person <span className="optional">(optional)</span>
            </label>
            <input {...input('contactPerson', { autoComplete: 'name' })} />
          </div>
          <div className="form-field">
            <label htmlFor="er-address">
              Address <span className="optional">(optional)</span>
            </label>
            <input {...input('address', { autoComplete: 'street-address' })} />
          </div>
          <div className="form-field">
            <label htmlFor="er-email">Email</label>
            <input {...input('email', { type: 'email', required: true, autoComplete: 'email' })} />
            <FieldError id="er-email" error={err.email} />
          </div>
          <div className="form-field">
            <label htmlFor="er-phone">Phone</label>
            <input {...input('phone', { type: 'tel', required: true, autoComplete: 'tel' })} />
            <FieldError id="er-phone" error={err.phone} />
          </div>
          <div className="form-field">
            <label htmlFor="er-eventType">Event Type</label>
            <select {...input('eventType', { required: true })}>
              <option value="">-- Select an Event --</option>
              {(menu.eventTypes ?? []).map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
              <option value="__other">Other (tell us)</option>
            </select>
            <FieldError id="er-eventType" error={err.eventType} />
            {v.eventType === '__other' && (
              <>
                <input
                  {...input('eventTypeOther', {
                    placeholder: 'Type of event',
                    'aria-label': 'Type of event',
                  })}
                  className="field-follow"
                />
                <FieldError id="er-eventTypeOther" error={err.eventTypeOther} />
              </>
            )}
          </div>
        </div>
      </fieldset>

      {/* When */}
      <fieldset className="form-section">
        <legend>Date, Time &amp; Guests</legend>
        <div className="form-grid form-grid-3">
          <div className="form-field">
            <label htmlFor="er-date">Date of Event</label>
            <input {...input('date', { type: 'date', required: true })} />
            <FieldError id="er-date" error={err.date} />
          </div>
          <div className="form-field">
            <label htmlFor="er-startTime">Start Time</label>
            <select {...input('startTime', { required: true, onChange: setStart })}>
              {startTimes.map((t) => (
                <option key={t} value={t}>
                  {time12(t)}
                </option>
              ))}
            </select>
            <FieldError id="er-startTime" error={err.startTime} />
          </div>
          <div className="form-field">
            <label htmlFor="er-endTime">Ending Time</label>
            <input
              {...input('endTime', { type: 'time', required: true, step: 900, onChange: setEnd })}
            />
            <FieldError id="er-endTime" error={err.endTime} />
            <p className="field-hint">
              Max {menu.includedHours} hrs; {money(menu.extraHourPrice)} extra for each additional
              hour{menu.timeLimitNote ? ` ${menu.timeLimitNote}` : ''}.
              {overtime > 0 && (
                <strong>
                  {' '}
                  This is {overtime} extra hour{overtime === 1 ? '' : 's'}.
                </strong>
              )}
            </p>
          </div>
          <div className="form-field">
            <label htmlFor="er-adults"># Of Guests Expected</label>
            <input
              {...input('adults', { type: 'number', min: 1, inputMode: 'numeric', required: true })}
            />
            <FieldError id="er-adults" error={err.adults} />
          </div>
          <div className="form-field">
            <label htmlFor="er-kids"># Of Kids Guests Expected</label>
            <input {...input('kids', { type: 'number', min: 0, inputMode: 'numeric' })} />
            <FieldError id="er-kids" error={err.kids} />
          </div>
        </div>
      </fieldset>

      {/* Menu */}
      {(menu.sections ?? []).map((section) => {
        if (section.forKids && !(kids > 0)) return null
        const key = section.key
        const options = (section.options ?? []).filter((o) => o.available !== false)
        const chosen = picked[key] ?? []
        const isTbd = Boolean(tbd[key])
        const errorId = `er-section-${key}`
        const tag =
          section.priceTag === 'adult'
            ? ` — ${money(menu.adultPrice)} plus taxes and ${menu.spaceFeePercent}% space rental fee`
            : section.priceTag === 'kids'
              ? ` — ${money(menu.kidPrice)}`
              : ''
        const rule = section.selection === 'multiple' ? pickRule(section.min, section.max) : ''
        return (
          <fieldset
            key={section.id}
            className="form-section"
            aria-describedby={err[`section.${key}`] ? errorId : undefined}
          >
            <legend>
              {section.title}
              {rule && ` — ${rule}`}
              {tag}
            </legend>
            {section.description && <p className="field-hint">{section.description}</p>}

            {section.allowToBeDecided && (
              <div className="radio-row">
                <label>
                  <input
                    type="radio"
                    checked={!isTbd}
                    onChange={() => setTbd((p) => ({ ...p, [key]: false }))}
                  />{' '}
                  Chosen
                </label>
                <label>
                  <input
                    type="radio"
                    checked={isTbd}
                    onChange={() => setTbd((p) => ({ ...p, [key]: true }))}
                  />{' '}
                  To be decided
                </label>
                {isTbd && <input type="hidden" name={`tbd.${key}`} value="1" />}
              </div>
            )}

            {!isTbd &&
              (section.selection === 'single' ? (
                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor={`er-${key}`}>{section.title}</label>
                    <select
                      id={`er-${key}`}
                      name={`section.${key}`}
                      value={chosen[0] ?? ''}
                      onChange={(e) =>
                        setPicked((p) => ({ ...p, [key]: e.target.value ? [e.target.value] : [] }))
                      }
                      aria-invalid={err[`section.${key}`] ? true : undefined}
                    >
                      <option value="">-- Choose --</option>
                      {options.map((o) => (
                        <option key={o.id} value={o.id!}>
                          {o.name}
                          {o.upcharge ? ` (+${money(o.upcharge)})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  {section.textOption?.label && (
                    <div className="form-field">
                      <label htmlFor={`er-text-${key}`}>
                        Add {section.textOption.label} (optional)
                        {section.textOption.upcharge
                          ? ` +${money(section.textOption.upcharge)}`
                          : ''}
                      </label>
                      <input
                        id={`er-text-${key}`}
                        name={`text.${key}`}
                        value={v[`text.${key}`] ?? ''}
                        onChange={set(`text.${key}`)}
                        placeholder={section.textOption.placeholder ?? ''}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <ul className="check-grid">
                  {options.map((o) => {
                    const on = chosen.includes(o.id!)
                    const full = Boolean(section.max) && chosen.length >= (section.max ?? 0)
                    return (
                      <li key={o.id}>
                        <label className={!on && full ? 'disabled' : undefined}>
                          <input
                            type="checkbox"
                            name={`section.${key}`}
                            value={o.id!}
                            checked={on}
                            disabled={!on && full}
                            onChange={() => toggle(key, o.id!, section.max)}
                          />
                          {o.name}
                          {o.upcharge ? (
                            <span className="upcharge"> (+{money(o.upcharge)})</span>
                          ) : null}
                        </label>
                      </li>
                    )
                  })}
                </ul>
              ))}
            <FieldError id={errorId} error={err[`section.${key}`]} />
          </fieldset>
        )
      })}

      {/* Extras */}
      {(menu.extras ?? []).some((e) => e.available !== false) && (
        <fieldset className="form-section">
          <legend>Extras</legend>
          <ul className="check-grid">
            {(menu.extras ?? [])
              .filter((e) => e.available !== false)
              .map((e) => (
                <li key={e.id}>
                  <label>
                    <input
                      type="checkbox"
                      name="extra"
                      value={e.id!}
                      checked={extras.includes(e.id!)}
                      onChange={() => toggleExtra(e.id!)}
                    />
                    {e.name}{' '}
                    <span className="upcharge">
                      {money(e.price)}
                      {e.unit === 'adult' ? ' per person' : ''}
                    </span>
                  </label>
                </li>
              ))}
          </ul>
        </fieldset>
      )}

      {/* Additional details */}
      {(menu.choices ?? []).length > 0 && (
        <fieldset className="form-section">
          <legend>Additional Details</legend>
          <div className="form-grid">
            {(menu.choices ?? []).map((c) => (
              <div
                key={c.id}
                className="form-field"
                role="radiogroup"
                aria-labelledby={`er-choice-${c.key}`}
              >
                <p id={`er-choice-${c.key}`} className="choice-label">
                  {c.label}
                </p>
                {(c.options ?? []).map((o) => (
                  <label key={o.id} className="radio-option">
                    <input
                      type="radio"
                      name={`choice.${c.key}`}
                      value={o.id!}
                      checked={choices[c.key] === o.id}
                      onChange={() => pickChoice(c.key, o.id!)}
                    />{' '}
                    {o.label}
                  </label>
                ))}
                <FieldError id={`er-choice-${c.key}`} error={err[`choice.${c.key}`]} />
              </div>
            ))}
          </div>
        </fieldset>
      )}

      {/* Other */}
      <fieldset className="form-section">
        <legend>Other</legend>
        <label className="check-line">
          <input
            type="checkbox"
            name="depositAcknowledged"
            checked={deposit}
            onChange={(e) => setDeposit(e.target.checked)}
            aria-invalid={err.depositAcknowledged ? true : undefined}
          />
          I understand a non-refundable deposit is required to hold the date.
        </label>
        <FieldError id="er-depositAcknowledged" error={err.depositAcknowledged} />
        <div className="form-field form-field-wide">
          <label htmlFor="er-notes">
            Notes <span className="optional">(optional)</span>
          </label>
          <textarea {...input('notes', { rows: 5 })} />
        </div>
      </fieldset>

      <div className="pricing-notes">
        <p className="choice-label">Pricing &amp; Notes</p>
        <ul>
          {pricingNotes(menu).map((n) => {
            const i = n.indexOf(':')
            return (
              <li key={n}>
                {i > 0 ? (
                  <>
                    <strong>{n.slice(0, i + 1)}</strong>
                    {n.slice(i + 1)}
                  </>
                ) : (
                  n
                )}
              </li>
            )
          })}
        </ul>
      </div>

      {/* Honeypot: hidden from people and screen readers */}
      <div className="hp" aria-hidden>
        <label htmlFor="er-website">Website</label>
        <input id="er-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <Turnstile ref={turnstile} theme="light" />

      {state.status === 'error' && state.message && (
        <p className="form-error" role="alert">
          {state.message}
        </p>
      )}

      <button type="submit" className="button-solid" disabled={pending}>
        {pending ? 'Sending…' : 'Submit Request'}
      </button>
    </form>
  )
}
