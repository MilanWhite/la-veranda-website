'use client'

import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { formatDate, formatTime } from '@/lib/eventRequests/summary'
import { requestAction } from './RequestActions'

type Template = { id?: string | null; name: string; body: string }

// "Reply ▾" on an event request: pick a reply template (Event Menu & Form → Reply Templates)
// or a blank reply. A window opens with the message filled in; edit it and press Send. The
// website emails it as the restaurant, as a reply in the customer's confirmation conversation,
// and records it in History.
export function ReplyMenu() {
  const { id } = useDocumentInfo()
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<Template[] | null>(null)
  const [draft, setDraft] = useState('')
  const [attachPdf, setAttachPdf] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)

  const f = useFormFields(([fields]) => {
    const v = (path: string) => fields[path]?.value as string | number | undefined
    return {
      email: v('customer.email') as string | undefined,
      company: (v('customer.nameOrCompany') as string) ?? '',
      contact: (v('customer.contactPerson') as string) ?? '',
      number: v('requestNumber'),
      type: (v('event.type') as string) ?? '',
      date: v('event.date') as string | undefined,
      start: v('event.startTime') as string | undefined,
      end: v('event.endTime') as string | undefined,
      adults: Number(v('event.adults') ?? 0),
      kids: Number(v('event.kids') ?? 0),
    }
  })

  // Load the templates the first time the menu opens
  useEffect(() => {
    if (!open || templates) return
    fetch('/api/globals/event-menu?depth=0', { credentials: 'include' })
      .then((r) => r.json())
      .then((menu: { replyTemplates?: Template[] }) => setTemplates(menu.replyTemplates ?? []))
      .catch(() => setTemplates([]))
  }, [open, templates])

  // Close the menu when clicking elsewhere or pressing Escape
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!f.email || !id) return null

  const values: Record<string, string> = {
    name: (f.contact || f.company).trim(),
    company: f.company.trim(),
    number: String(f.number ?? ''),
    eventType: f.type,
    date: formatDate(f.date),
    time: [formatTime(f.start), formatTime(f.end)].filter(Boolean).join(' – '),
    guests: `${f.adults} adult${f.adults === 1 ? '' : 's'}${f.kids ? ` + ${f.kids} kid${f.kids === 1 ? '' : 's'}` : ''}`,
  }
  const fill = (text: string) =>
    text.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match)

  const start = (text: string) => {
    setOpen(false)
    setDraft(text)
    setAttachPdf(false)
    setError(null)
    dialog.current?.showModal()
  }

  const send = async () => {
    if (!draft.trim()) return setError('Please write a message.')
    setSending(true)
    setError(null)
    try {
      // Reloads the page on success, so History shows the reply
      await requestAction(id, 'reply', { message: draft, attachPdf })
    } catch (e) {
      setError((e as Error).message)
      setSending(false)
    }
  }

  return (
    <div className="lv-reply" ref={box}>
      <button
        type="button"
        className="lv-act"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        Reply ▾
      </button>
      {open && (
        <div className="lv-reply-menu" role="menu">
          {templates === null && <span className="lv-reply-note">Loading…</span>}
          {templates?.map((t) => (
            <button
              key={t.id ?? t.name}
              type="button"
              role="menuitem"
              onClick={() => start(fill(t.body))}
            >
              {t.name}
            </button>
          ))}
          <button type="button" role="menuitem" onClick={() => start(`Hi ${values.name},\n\n`)}>
            Blank reply
          </button>
          <Link
            role="menuitem"
            className="lv-reply-edit"
            href="/admin/globals/event-menu#reply-templates"
          >
            Edit templates…
          </Link>
        </div>
      )}

      <dialog ref={dialog} className="lv-reply-dialog" aria-label="Reply to the customer">
        <div className="lv-reply-dialog-head">
          <h2>Reply to {values.name}</h2>
          <p>
            To <strong>{f.email}</strong> · Subject “Re: Your event request #{values.number} at La
            Veranda (…)”
          </p>
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={16}
          aria-label="Message"
        />
        <label className="lv-reply-attach">
          <input
            type="checkbox"
            checked={attachPdf}
            onChange={(e) => setAttachPdf(e.target.checked)}
          />
          Attach the booking summary PDF
        </label>
        <p className="lv-reply-hint">
          Sent from the restaurant’s email as a reply in the customer’s conversation. A copy is kept
          in its Sent mail and the reply is noted in History.
        </p>
        {error && (
          <p className="lv-msg lv-msg-error" role="alert">
            {error}
          </p>
        )}
        <div className="lv-reply-buttons">
          <button
            type="button"
            className="lv-act"
            onClick={() => dialog.current?.close()}
            disabled={sending}
          >
            Cancel
          </button>
          <button type="button" className="lv-act lv-act-approve" onClick={send} disabled={sending}>
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </dialog>
    </div>
  )
}
