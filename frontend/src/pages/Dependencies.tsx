import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { TaskDependencyGraph, TaskNode } from '../types/api'
import StatusBadge from '../components/StatusBadge'

const DEPT_COLORS: Record<string, string> = {
  SIT: '#92400e', GRD: '#1d4ed8', THM: '#0f766e', PVE: '#4f46e5',
  EMS: '#7c3aed', COM: '#0891b2', PUR: '#9a3412', PMO: '#374151',
}

const STATUS_FILL: Record<string, string> = {
  completed: '#bbf7d0', in_progress: '#bfdbfe', not_started: '#f3f4f6',
}

export default function Dependencies() {
  const [tab, setTab] = useState<'tasks' | 'components'>('tasks')

  return (
    <div className="space-y-4 max-w-full">
      <h1 className="text-2xl font-bold text-gray-900">Dependencies</h1>
      <div className="flex gap-2">
        {(['tasks', 'components'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded text-sm font-medium ${tab === t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {t === 'tasks' ? 'Task Dependencies' : 'Component Dependencies'}
          </button>
        ))}
      </div>
      {tab === 'tasks' ? <TaskDag /> : <ComponentDeps />}
    </div>
  )
}

function TaskDag() {
  const [graph, setGraph] = useState<TaskDependencyGraph | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    api.taskDependencies().then(setGraph)
  }, [])

  if (!graph) return <div className="p-4 text-gray-400 animate-pulse">Loading…</div>

  const leafNodes = graph.nodes.filter(n => !n.is_work_package)
  const depts = Array.from(new Set(leafNodes.map(n => n.dept_id)))

  const visible = filter === 'all' ? leafNodes : leafNodes.filter(n => n.dept_id === filter)
  const visibleIds = new Set(visible.map(n => n.id))
  const visibleEdges = graph.edges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target))

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center text-xs">
        <span className="text-gray-500">Filter by dept:</span>
        <button
          onClick={() => setFilter('all')}
          className={`px-2 py-1 rounded ${filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
        >All</button>
        {depts.map(d => (
          <button
            key={d}
            onClick={() => setFilter(d)}
            style={{ backgroundColor: filter === d ? DEPT_COLORS[d] : undefined, color: filter === d ? 'white' : undefined }}
            className={`px-2 py-1 rounded ${filter !== d ? 'bg-gray-100 text-gray-600' : ''}`}
          >{d}</button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-500">
        {Object.entries(STATUS_FILL).map(([s, color]) => (
          <span key={s} className="flex items-center gap-1">
            <span className="w-3 h-3 rounded border border-gray-300 inline-block" style={{ backgroundColor: color }} />
            {s.replace('_', ' ')}
          </span>
        ))}
      </div>

      {/* Node grid */}
      <div className="bg-white rounded-lg border p-4 overflow-x-auto">
        <div className="flex flex-wrap gap-2">
          {visible.map(node => (
            <NodeCard key={node.id} node={node} edges={visibleEdges} />
          ))}
        </div>
      </div>

      {/* Edge list */}
      <div className="bg-white rounded-lg border">
        <div className="px-4 py-3 border-b text-sm font-semibold text-gray-700">
          Dependency Edges ({visibleEdges.length})
        </div>
        <div className="divide-y max-h-64 overflow-y-auto text-xs">
          {visibleEdges.map((e, i) => {
            const src = graph.nodes.find(n => n.id === e.source)
            const tgt = graph.nodes.find(n => n.id === e.target)
            return (
              <div key={i} className="px-4 py-2 flex gap-3 items-center">
                <span className="font-mono text-gray-500">{e.source}</span>
                <span className="text-gray-300">→</span>
                <span className="font-mono text-gray-500">{e.target}</span>
                <span className="text-gray-400 flex-1">{tgt?.label}</span>
                {e.lag_days > 0 && <span className="text-gray-400">+{e.lag_days}d lag</span>}
                <StatusBadge status={src?.status ?? 'not_started'} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function NodeCard({ node, edges }: { node: TaskNode; edges: { source: string; target: string }[] }) {
  const incomingCount = edges.filter(e => e.target === node.id).length
  const outgoingCount = edges.filter(e => e.source === node.id).length
  return (
    <div
      className="rounded border px-2.5 py-2 text-xs min-w-[120px]"
      style={{
        backgroundColor: STATUS_FILL[node.status] ?? '#f9fafb',
        borderLeftColor: DEPT_COLORS[node.dept_id] ?? '#6b7280',
        borderLeftWidth: 3,
      }}
    >
      <div className="font-mono text-gray-500 mb-0.5">{node.id}</div>
      <div className="font-medium text-gray-800 truncate max-w-[160px]" title={node.label}>{node.label}</div>
      <div className="text-gray-400 mt-1">
        {incomingCount > 0 && <span className="mr-2">←{incomingCount}</span>}
        {outgoingCount > 0 && <span>→{outgoingCount}</span>}
      </div>
    </div>
  )
}

function ComponentDeps() {
  const [data, setData] = useState<{ nodes: { id: string; label: string; type: string; status: string; dept_id: string }[]; edges: { source: string; target: string; dependency_type: string }[] } | null>(null)

  useEffect(() => {
    api.components().then(() => {}) // preload
    fetch('/api/components/dependencies').then(r => r.json()).then(setData)
  }, [])

  if (!data) return <div className="p-4 text-gray-400 animate-pulse">Loading…</div>

  const DEP_COLORS: Record<string, string> = {
    power: 'text-yellow-700 bg-yellow-50',
    thermal: 'text-orange-700 bg-orange-50',
    metering: 'text-blue-700 bg-blue-50',
    physical_space: 'text-green-700 bg-green-50',
    ems: 'text-purple-700 bg-purple-50',
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3 flex-wrap text-xs">
        {Object.entries(DEP_COLORS).map(([type, cls]) => (
          <span key={type} className={`px-2 py-0.5 rounded font-medium ${cls}`}>{type}</span>
        ))}
      </div>
      <div className="bg-white rounded-lg border">
        <div className="px-4 py-3 border-b text-sm font-semibold text-gray-700">
          Component Dependencies ({data.edges.length} edges)
        </div>
        <div className="divide-y max-h-96 overflow-y-auto text-xs">
          {data.edges.map((e, i) => {
            const src = data.nodes.find(n => n.id === e.source)
            const tgt = data.nodes.find(n => n.id === e.target)
            const cls = DEP_COLORS[e.dependency_type] ?? 'text-gray-600 bg-gray-50'
            return (
              <div key={i} className="px-4 py-2 flex gap-3 items-center">
                <span className="font-mono text-gray-600 shrink-0">{e.source}</span>
                <span className="text-gray-400 shrink-0">needs</span>
                <span className="font-mono text-gray-600 shrink-0">{e.target}</span>
                <span className="text-gray-400 hidden sm:block flex-1 truncate">{tgt?.label}</span>
                <span className={`px-1.5 py-0.5 rounded font-medium ${cls} shrink-0`}>{e.dependency_type}</span>
                <StatusBadge status={src?.status ?? 'planned'} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
