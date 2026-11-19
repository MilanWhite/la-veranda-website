'use client'

import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { useState } from 'react'

import { formatDate } from '@/lib/eventRequests/summary'
import { ACTIONS, requestAction, type Status } from './RequestActions'
import { StatusBadge } from './StatusBadge'

// The top bar of an event request (sits where Payload's Save button is): request number,
// customer and date with the status on the left; Approve / Decline / Cancel and the PDF on
// the right, next to Save and ⋯ (which holds the rarer actions).
export function RequestHeader() {
  const { id } = useDocumentInfo()
  const value = useFormFields(([fields]) => ({
    number: fields.requestNumber?.value as number | undefined,
    name: fields.customerName?.value as string | undefined,
    date: fields.startsOn?.value as string | undefined,
    status: fields.status?.value as Status | undefined,
  }))
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  if (!id || !value.status) return null

  const run = async (label: string, path: string, body?: object) => {
    setBusy(label)
    setError(null)
    try {
      await requestAction(id, path, body)
    } catch (e) {
      setError((e as Error).message)
      setBusy(null)
    }
  }

  return (
    <div className="lv-reqbar">
      <div className="lv-reqbar-title">
        <h1>
          <span className="lv-reqbar-number">#{value.number}</span> {value.name}
        </h1>
        <StatusBadge status={value.status} />
        <p>{formatDate(value.date)}</p>
      </div>

      <div className="lv-reqbar-actions">
        {error && (
          <span className="lv-reqbar-error" role="alert">
            {error}
          </span>
        )}
        {ACTIONS[value.status].map((a) => (
          <button
            key={a.to}
            type="button"
            className={`lv-act lv-act-${a.tone}`}
            disabled={Boolean(busy)}
            onClick={() => window.confirm(a.confirm) && run(a.label, 'status', { status: a.to })}
          >
            {busy === a.label ? 'Working…' : a.label}
          </button>
        ))}
        <a
          className="lv-act"
          href={`/api/event-requests/${id}/pdf`}
          target="_blank"
          rel="noreferrer"
        >
          View PDF
        </a>
      </div>
    </div>
  )
}
