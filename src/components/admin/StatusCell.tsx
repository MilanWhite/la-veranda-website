'use client'

import { StatusBadge } from './StatusBadge'

// Status column in the Event Requests list.
export function StatusCell({ cellData }: { cellData?: unknown }) {
  return <StatusBadge status={typeof cellData === 'string' ? cellData : null} />
}
