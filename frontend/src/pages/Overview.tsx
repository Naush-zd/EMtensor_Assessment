import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { OverviewData } from '../types/api'
import ProgressBar from '../components/ProgressBar'
import StatusBadge from '../components/StatusBadge'

const INR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const DEPT_NAMES: Record<string, string> = {
  SIT: 'Site & Civil',
  GRD: 'Grid & Dist.',
  THM: 'Battery Thermal',
  PVE: 'PV & Storage',
  EMS: 'Energy Mgmt SW',
  COM: 'Community',
  PUR: 'Procurement',
  PMO: 'Project Office',
}

export default function Overview() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.overview().then(setData).catch(e => setError(String(e)))
  }, [])

  if (error) return <div className="text-red-600 p-4">{error}</div>
  if (!data) return <div className="p-4 text-gray-400 animate-pulse">Loading…</div>

  const MONSOON_DATE = new Date('2027-05-01')
  const today = new Date(data.as_of)
  const daysLeft = Math.floor((MONSOON_DATE.getTime() - today.getTime()) / 86400000)

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900">Surya Gram: 12-Village Solar Microgrid</h1>

      {/* Hero stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Grant Total" value={INR(data.grant_total_inr)} />
        <StatCard label="Released" value={INR(data.released_total_inr)} sub={`${Math.round((data.released_total_inr / data.grant_total_inr) * 100)}% of grant`} />
        <StatCard label="Tasks Complete" value={`${data.tasks_completed} / ${data.tasks_total}`} sub={`${data.overall_pct_complete}%`} />
        <StatCard label="Days to Monsoon" value={`${daysLeft}`} sub="energise by May 2027" highlight />
      </div>

      {/* Overall progress bar */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Overall project progress</span>
          <span className="font-semibold">{data.overall_pct_complete}%</span>
        </div>
        <ProgressBar pct={data.overall_pct_complete} />
        <div className="flex gap-6 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{data.tasks_completed} completed</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />{data.tasks_in_progress} in progress</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />{data.tasks_not_started} not started</span>
        </div>
      </div>

      {/* Tranches */}
      <div className="bg-white rounded-lg border p-4">
        <h2 className="font-semibold text-gray-800 mb-3">Funding Tranches</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {data.tranches.map(t => (
            <div key={t.tranche_id} className={`rounded-lg border p-3 ${t.status === 'released' ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-700">{t.tranche_id}</span>
                <StatusBadge status={t.status} />
              </div>
              <div className="text-sm font-semibold text-gray-900">{INR(t.amount_inr)}</div>
              <div className="text-xs text-gray-500 mt-1">{t.pct_of_grant}% of grant</div>
              {t.actual_release && <div className="text-xs text-green-700 mt-1">Released {t.actual_release}</div>}
              {!t.actual_release && <div className="text-xs text-gray-400 mt-1">After milestone {t.condition_milestone_id}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-lg border p-4">
        <h2 className="font-semibold text-gray-800 mb-3">Milestones</h2>
        <div className="space-y-2">
          {data.milestones.map(m => (
            <div key={m.milestone_id} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50">
              <StatusBadge status={m.reported_status} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800">{m.milestone_name}</div>
                <div className="text-xs text-gray-400">Due {m.due_date ?? 'TBD'}{m.releases_tranche_id && ` · Releases ${m.releases_tranche_id}`}</div>
              </div>
              <div className="text-xs text-gray-400 shrink-0">{m.milestone_id}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-dept mini bars */}
      <div className="bg-white rounded-lg border p-4">
        <h2 className="font-semibold text-gray-800 mb-3">Department Progress</h2>
        <div className="space-y-3">
          {Object.entries(data.dept_progress).map(([id, dp]) => {
            const pct = dp.total > 0 ? Math.round((dp.completed / dp.total) * 100) : 0
            return (
              <div key={id}>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{DEPT_NAMES[id] ?? id}</span>
                  <span>{dp.completed}/{dp.total} tasks · {pct}%</span>
                </div>
                <ProgressBar pct={pct} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${highlight ? 'border-yellow-400 bg-yellow-50' : 'bg-white'}`}>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  )
}
