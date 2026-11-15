const LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  declined: 'Declined',
  cancelled: 'Cancelled',
}

// Coloured status pill used in the requests list, the dashboard and the request overview.
export function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return null
  return <span className={`lv-badge lv-badge-${status}`}>{LABELS[status] ?? status}</span>
}
