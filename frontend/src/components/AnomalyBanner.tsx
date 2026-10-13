import { useState, useEffect } from 'react'
import { api } from '../api/client'
import type { Anomaly } from '../types/api'

export default function AnomalyBanner() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'error' | 'warning'>('all')

  useEffect(() => {
    api.anomalies().then(setAnomalies).catch(() => {})
  }, [])

  const errors = anomalies.filter(a => a.severity === 'error').length
  const warnings = anomalies.filter(a => a.severity === 'warning').length
  const visible = filter === 'all' ? anomalies : anomalies.filter(a => a.severity === filter)

  if (anomalies.length === 0) return null

  return (
    <>
      {/* Top bar */}
      <div className="bg-red-50 border-b border-red-200 px-6 py-2 flex items-center justify-between text-sm">
        <div className="flex gap-4">
          {errors > 0 && (
            <span className="text-red-700 font-medium">
              {errors} rule violation{errors !== 1 ? 's' : ''}
            </span>
          )}
          {warnings > 0 && (
            <span className="text-amber-700">
              {warnings} warning{warnings !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          onClick={() => setOpen(true)}
          className="text-red-700 hover:text-red-900 font-medium underline"
        >
          View all anomalies
        </button>
      </div>

      {/* Side panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative ml-auto w-full max-w-xl bg-white shadow-xl flex flex-col h-full">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Anomaly Report</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">&times;</button>
            </div>
            <div className="px-5 py-3 border-b flex gap-2">
              {(['all', 'error', 'warning'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    filter === f
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' ? `All (${anomalies.length})` : f === 'error' ? `Errors (${errors})` : `Warnings (${warnings})`}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto divide-y">
              {visible.map((a, i) => (
                <div key={i} className="px-5 py-3">
                  <div className="flex items-start gap-2">
                    <span className={`mt-0.5 shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      a.severity === 'error' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>{a.rule_id}</span>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800">{a.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{a.detail}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] text-gray-400 uppercase">{a.entity_type}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{a.entity_id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
