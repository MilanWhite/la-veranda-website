'use client'

import { PopupList, useDocumentInfo, useFormFields } from '@payloadcms/ui'

import { requestAction } from './RequestActions'

// Rarely needed request actions, tucked into the ⋯ menu next to Save.
export function RequestMenuItems() {
  const { id } = useDocumentInfo()
  const status = useFormFields(([fields]) => fields.status?.value as string | undefined)
  if (!id) return null

  const run = async (confirm: string | null, path: string) => {
    if (confirm && !window.confirm(confirm)) return
    try {
      await requestAction(id, path)
    } catch (e) {
      window.alert((e as Error).message)
    }
  }

  return (
    <>
      <PopupList.Button
        onClick={() => run('Send the confirmation and notification emails again?', 'resend-emails')}
      >
        Resend emails
      </PopupList.Button>
      {(status === 'approved' || status === 'cancelled') && (
        <PopupList.Button onClick={() => run(null, 'calendar-sync')}>
          Sync Google Calendar again
        </PopupList.Button>
      )}
    </>
  )
}
