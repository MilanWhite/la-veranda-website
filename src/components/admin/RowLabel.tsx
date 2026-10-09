'use client'

import { useRowLabel } from '@payloadcms/ui'

// Shows an array row's title/name/label in the admin instead of "Item 01".
export function RowLabel() {
  const { data, rowNumber } = useRowLabel<{ title?: string; name?: string; label?: string }>()
  const text = data?.title || data?.name || data?.label
  return <span>{text || `Row ${String((rowNumber ?? 0) + 1).padStart(2, '0')}`}</span>
}
