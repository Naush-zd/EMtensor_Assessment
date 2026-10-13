interface Props {
  pct: number
  colorClass?: string
}

export default function ProgressBar({ pct, colorClass = 'bg-yellow-500' }: Props) {
  const clamped = Math.min(100, Math.max(0, pct))
  return (
    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
      <div className={`h-full ${colorClass} transition-all`} style={{ width: `${clamped}%` }} />
    </div>
  )
}
