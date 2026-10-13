import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Person } from '../types/api'
import StatusBadge from '../components/StatusBadge'

export default function People() {
  const [people, setPeople] = useState<Person[]>([])
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.people().then(setPeople).catch(e => setError(String(e)))
  }, [])

  if (error) return <div className="text-red-600 p-4">{error}</div>
  if (!people.length) return <div className="p-4 text-gray-400 animate-pulse">Loading…</div>

  const depts = Array.from(new Set(people.map(p => p.dept_id))).sort()

  const filtered = people.filter(p => {
    const matchDept = deptFilter === 'all' || p.dept_id === deptFilter
    const matchSearch = !search ||
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.role.toLowerCase().includes(search.toLowerCase()) ||
      p.researcher_id.toLowerCase().includes(search.toLowerCase())
    return matchDept && matchSearch
  })

  const INR = (n: number) =>
    n === 0 ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

  const exited = people.filter(p => p.status === 'exited').length
  const onLeave = people.filter(p => p.status === 'on_leave').length

  return (
    <div className="space-y-4 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900">People</h1>

      {/* Summary */}
      <div className="flex gap-4 text-sm text-gray-600">
        <span><span className="font-semibold text-gray-900">{people.length}</span> total</span>
        <span><span className="font-semibold text-green-700">{people.length - exited - onLeave}</span> active</span>
        {onLeave > 0 && <span><span className="font-semibold text-amber-700">{onLeave}</span> on leave</span>}
        {exited > 0 && <span><span className="font-semibold text-gray-500">{exited}</span> exited</span>}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, role, ID…"
          className="border rounded px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          <option value="all">All departments</option>
          {depts.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-400 uppercase border-b">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Dept</th>
                <th className="text-left px-4 py-2">Role</th>
                <th className="text-right px-4 py-2">Alloc %</th>
                <th className="text-right px-4 py-2">Monthly Cost</th>
                <th className="text-left px-4 py-2">Joined</th>
                <th className="text-left px-4 py-2">Left</th>
                <th className="text-left px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(p => (
                <tr key={p.researcher_id} className={p.status === 'exited' ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-gray-800">{p.full_name}</div>
                    <div className="text-xs text-gray-400 font-mono">{p.researcher_id}</div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{p.dept_id}</td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">{p.role}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700">{p.project_allocation_pct}%</td>
                  <td className="px-4 py-2.5 text-right text-gray-600">{INR(p.monthly_cost_inr)}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{p.joined_on ?? '—'}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{p.left_on ?? '—'}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">No people match your filters.</div>
        )}
      </div>
    </div>
  )
}
