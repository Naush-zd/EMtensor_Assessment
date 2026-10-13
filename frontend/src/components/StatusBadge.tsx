const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  in_progress: 'bg-blue-100 text-blue-800',
  not_started: 'bg-gray-100 text-gray-600',
  released: 'bg-green-100 text-green-800',
  pending: 'bg-gray-100 text-gray-600',
  achieved: 'bg-green-100 text-green-800',
  on_track: 'bg-blue-100 text-blue-800',
  at_risk: 'bg-amber-100 text-amber-800',
  delayed: 'bg-red-100 text-red-800',
  active: 'bg-green-100 text-green-800',
  on_leave: 'bg-amber-100 text-amber-800',
  exited: 'bg-gray-100 text-gray-500',
}

const LABELS: Record<string, string> = {
  in_progress: 'In Progress',
  not_started: 'Not Started',
}

export default function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'
  const label = LABELS[status] ?? status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${style}`}>
      {label}
    </span>
  )
}
