import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Department, DepartmentDetail } from '../types/api'
import ProgressBar from '../components/ProgressBar'
import StatusBadge from '../components/StatusBadge'

const INR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export default function Departments() {
  const { id } = useParams<{ id?: string }>()
  if (id) return <DeptDetail id={id} />
  return <DeptGrid />
}

function DeptGrid() {
  const [depts, setDepts] = useState<Department[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.departments().then(setDepts).catch(e => setError(String(e)))
  }, [])

  if (error) return <div className="text-red-600 p-4">{error}</div>
  if (!depts.length) return <div className="p-4 text-gray-400 animate-pulse">Loading…</div>

  return (
    <div className="space-y-4 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {depts.map(d => (
          <Link
            key={d.dept_id}
            to={`/departments/${d.dept_id}`}
            className="bg-white rounded-lg border hover:border-yellow-400 hover:shadow-sm transition-all p-4 block"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-semibold text-gray-900">{d.dept_name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{d.scope}</div>
              </div>
              <span className="text-xs text-gray-400 font-mono shrink-0 ml-2">{d.dept_id}</span>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{d.tasks_completed}/{d.tasks_total} · {d.pct_complete}%</span>
              </div>
              <ProgressBar pct={d.pct_complete} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs mt-2">
              <div>
                <div className="text-gray-400">Budget</div>
                <div className="font-medium text-gray-700">{INR(d.total_budget_inr)}</div>
              </div>
              <div>
                <div className="text-gray-400">Allocated</div>
                <div className="font-medium text-gray-700">{INR(d.allocated_inr)}</div>
              </div>
              <div>
                <div className="text-gray-400">Spent</div>
                <div className={`font-medium ${d.spent_inr > d.allocated_inr ? 'text-red-600' : 'text-gray-700'}`}>
                  {INR(d.spent_inr)}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-2">{d.researcher_count} people</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function DeptDetail({ id }: { id: string }) {
  const [detail, setDetail] = useState<DepartmentDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.department(id).then(setDetail).catch(e => setError(String(e)))
  }, [id])

  if (error) return <div className="text-red-600 p-4">{error}</div>
  if (!detail) return <div className="p-4 text-gray-400 animate-pulse">Loading…</div>

  const errors = detail.anomalies.filter(a => a.severity === 'error').length
  const warnings = detail.anomalies.filter(a => a.severity === 'warning').length

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/departments')} className="text-sm text-gray-400 hover:text-gray-700">← Departments</button>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium">{detail.dept_name}</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{detail.dept_name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{detail.scope}</p>
        </div>
        {(errors > 0 || warnings > 0) && (
          <div className="flex gap-2">
            {errors > 0 && <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-medium">{errors} error{errors !== 1 ? 's' : ''}</span>}
            {warnings > 0 && <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 text-xs font-medium">{warnings} warning{warnings !== 1 ? 's' : ''}</span>}
          </div>
        )}
      </div>

      {/* Budget summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Budget', value: INR(detail.total_budget_inr) },
          { label: 'Allocated (released)', value: INR(detail.allocated_released_inr) },
          { label: 'Allocated (total)', value: INR(detail.allocated_total_inr) },
          { label: 'Spent', value: INR(detail.spent_total_inr), alert: detail.spent_total_inr > detail.allocated_released_inr },
        ].map(({ label, value, alert }) => (
          <div key={label} className={`bg-white rounded-lg border p-3 ${alert ? 'border-red-300' : ''}`}>
            <div className="text-xs text-gray-400">{label}</div>
            <div className={`text-base font-semibold mt-0.5 ${alert ? 'text-red-600' : 'text-gray-900'}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tasks */}
      <div className="bg-white rounded-lg border">
        <div className="px-4 py-3 border-b font-semibold text-sm text-gray-700">Tasks</div>
        <div className="divide-y">
          {detail.tasks.map(t => {
            const prog = detail.latest_progress[t.task_id]
            return (
              <div key={t.task_id} className="px-4 py-3 flex items-start gap-3">
                <StatusBadge status={t.status} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800">{t.task_name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {t.planned_start} → {t.planned_end ?? '?'}
                    {t.actual_end && <span className="text-green-600"> · Done {t.actual_end}</span>}
                  </div>
                  {prog?.blocker && (
                    <div className="mt-1 text-xs text-red-600 bg-red-50 rounded px-2 py-0.5 inline-block">
                      Blocked: {prog.blocker}
                    </div>
                  )}
                </div>
                {prog && (
                  <div className="text-xs text-gray-500 shrink-0 text-right">
                    <div className="font-medium">{prog.percent_complete}%</div>
                    <div className="text-gray-300">{prog.report_date}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* People */}
      <div className="bg-white rounded-lg border">
        <div className="px-4 py-3 border-b font-semibold text-sm text-gray-700">People ({detail.researchers.length})</div>
        <div className="divide-y">
          {detail.researchers.map(r => (
            <div key={r.researcher_id} className="px-4 py-2.5 flex items-center gap-3 text-sm">
              <span className="font-medium text-gray-800 flex-1">{r.full_name}</span>
              <span className="text-gray-500 text-xs">{r.role}</span>
              <span className="text-gray-400 text-xs">{r.project_allocation_pct}%</span>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>
      </div>

      {/* Anomalies */}
      {detail.anomalies.length > 0 && (
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-3 border-b font-semibold text-sm text-gray-700">Anomalies for this department</div>
          <div className="divide-y">
            {detail.anomalies.map((a, i) => (
              <div key={i} className="px-4 py-3 flex gap-2">
                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold h-fit ${
                  a.severity === 'error' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}>{a.rule_id}</span>
                <div>
                  <div className="text-sm text-gray-800">{a.message}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{a.entity_type} · {a.entity_id}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
