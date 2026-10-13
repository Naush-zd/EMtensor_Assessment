import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { BudgetData } from '../types/api'
import StatusBadge from '../components/StatusBadge'

const INR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const pct = (part: number, total: number) =>
  total > 0 ? `${Math.round((part / total) * 100)}%` : '—'

export default function Budget() {
  const [data, setData] = useState<BudgetData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.budget().then(setData).catch(e => setError(String(e)))
  }, [])

  if (error) return <div className="text-red-600 p-4">{error}</div>
  if (!data) return <div className="p-4 text-gray-400 animate-pulse">Loading…</div>

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900">Budget</h1>

      {/* Waterfall */}
      <div className="bg-white rounded-lg border p-5">
        <h2 className="font-semibold text-gray-700 mb-4">Grant Waterfall</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <WaterfallStep
            label="Grant Total"
            value={data.grant_total_inr}
            base={data.grant_total_inr}
            color="bg-gray-700"
          />
          <WaterfallStep
            label="Released"
            value={data.released_total_inr}
            base={data.grant_total_inr}
            color="bg-green-500"
            sub={pct(data.released_total_inr, data.grant_total_inr) + ' of grant'}
          />
          <WaterfallStep
            label="Allocated (released)"
            value={data.allocated_released_inr}
            base={data.grant_total_inr}
            color="bg-blue-400"
            sub={pct(data.allocated_released_inr, data.released_total_inr) + ' of released'}
          />
          <WaterfallStep
            label="Spent"
            value={data.spent_total_inr}
            base={data.grant_total_inr}
            color={data.spent_total_inr > data.released_total_inr ? 'bg-red-500' : 'bg-yellow-500'}
            sub={pct(data.spent_total_inr, data.released_total_inr) + ' of released'}
          />
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Unspent released: <span className="font-semibold">{INR(data.unspent_released_inr)}</span>
        </div>
      </div>

      {/* Tranches */}
      <div className="bg-white rounded-lg border p-4">
        <h2 className="font-semibold text-gray-700 mb-3">Tranches</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {data.tranches.map(t => (
            <div key={t.tranche_id} className={`rounded border p-3 ${t.status === 'released' ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-xs text-gray-700">{t.tranche_id}</span>
                <StatusBadge status={t.status} />
              </div>
              <div className="text-sm font-semibold text-gray-900">{INR(t.amount_inr)}</div>
              <div className="text-xs text-gray-400 mt-0.5">{t.pct_of_grant}% · Milestone {t.condition_milestone_id}</div>
              {t.actual_release && <div className="text-xs text-green-700 mt-1">{t.actual_release}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Per-dept table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b font-semibold text-sm text-gray-700">Department Breakdown</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left px-4 py-2">Department</th>
                <th className="text-right px-4 py-2">Budget</th>
                <th className="text-right px-4 py-2">Allocated</th>
                <th className="text-right px-4 py-2">Spent</th>
                <th className="text-right px-4 py-2">% Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.by_dept.map(d => {
                const over = d.spent_inr > d.allocated_released_inr
                return (
                  <tr key={d.dept_id} className={over ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-gray-800">{d.dept_name}</div>
                      <div className="text-xs text-gray-400">{d.dept_id}</div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{INR(d.budget_inr)}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{INR(d.allocated_inr)}</td>
                    <td className={`px-4 py-2.5 text-right font-medium ${over ? 'text-red-600' : 'text-gray-800'}`}>{INR(d.spent_inr)}</td>
                    <td className="px-4 py-2.5 text-right text-gray-500">
                      {pct(d.spent_inr, d.allocated_inr)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category breakdown for largest dept */}
      <div className="bg-white rounded-lg border">
        <div className="px-4 py-3 border-b font-semibold text-sm text-gray-700">Category Breakdown by Department</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-400 uppercase">
              <tr>
                <th className="text-left px-4 py-2">Dept</th>
                <th className="text-left px-4 py-2">Category</th>
                <th className="text-right px-4 py-2">Allocated</th>
                <th className="text-right px-4 py-2">Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.by_dept.flatMap(d =>
                Object.entries(d.by_category).map(([cat, vals]) => ({
                  dept_id: d.dept_id,
                  dept_name: d.dept_name,
                  cat,
                  ...vals,
                }))
              ).map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-500">{row.dept_id}</td>
                  <td className="px-4 py-2 text-gray-700">{row.cat}</td>
                  <td className="px-4 py-2 text-right text-gray-600">{INR(row.allocated_inr)}</td>
                  <td className={`px-4 py-2 text-right font-medium ${row.spent_inr > row.allocated_inr ? 'text-red-600' : 'text-gray-700'}`}>
                    {INR(row.spent_inr)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function WaterfallStep({ label, value, base, color, sub }: {
  label: string; value: number; base: number; color: string; sub?: string
}) {
  const barPct = base > 0 ? Math.min(100, (value / base) * 100) : 0
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="h-24 bg-gray-100 rounded relative flex items-end">
        <div className={`absolute bottom-0 left-0 right-0 ${color} rounded`} style={{ height: `${barPct}%` }} />
      </div>
      <div className="text-sm font-semibold text-gray-900">{INR(value)}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  )
}
