import React, { useState } from 'react'
import { getReport, MEAL_PRICES } from '../api'

function localToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function firstOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`
}

function fmtDate(str) {
  const [y,m,d] = str.split('-')
  return new Date(+y,+m-1,+d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})
}

export default function Report() {
  const [from, setFrom]   = useState(firstOfMonth())
  const [to, setTo]       = useState(localToday())
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    if (!from || !to || from > to) return
    setLoading(true)
    setError('')
    try {
      const result = await getReport(from, to)
      setData(result)
      setGenerated(true)
    } catch (e) {
      setError(e?.message || 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  const grandMeals  = data?.reduce((s, p) => s + p.totalMeals, 0) ?? 0
  const grandB      = data?.reduce((s, p) => s + p.counts.breakfast, 0) ?? 0
  const grandL      = data?.reduce((s, p) => s + p.counts.lunch, 0) ?? 0
  const grandD      = data?.reduce((s, p) => s + p.counts.dinner, 0) ?? 0
  const grandTotal  = data?.reduce((s, p) => s + p.total, 0) ?? 0

  return (
    <div>
      {/* Controls */}
      <div className="no-print mb-6">
        <h1 className="text-2xl font-bold text-notion-text tracking-tight mb-1">Report</h1>
        <p className="label-mono mb-5">Select date range to generate</p>

        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[130px]">
            <label className="label-mono block mb-1">From</label>
            <input
              type="date"
              value={from}
              max={to}
              onChange={e => { setFrom(e.target.value); setGenerated(false) }}
              className="w-full border border-notion-border rounded-md px-3 py-2 text-sm bg-notion-bg text-notion-text focus:border-notion-text focus:ring-1 focus:ring-notion-text"
            />
          </div>
          <div className="flex-1 min-w-[130px]">
            <label className="label-mono block mb-1">To</label>
            <input
              type="date"
              value={to}
              min={from}
              max={localToday()}
              onChange={e => { setTo(e.target.value); setGenerated(false) }}
              className="w-full border border-notion-border rounded-md px-3 py-2 text-sm bg-notion-bg text-notion-text focus:border-notion-text focus:ring-1 focus:ring-notion-text"
            />
          </div>
          <button
            onClick={generate}
            disabled={loading || !from || !to || from > to}
            className="px-5 py-2 bg-notion-text text-notion-bg rounded-md text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Generate'}
          </button>
          {error && (
            <p className="mt-3 text-sm text-notion-subtle border border-notion-border rounded-md px-3 py-2 bg-notion-bgSoft">
              {error}
            </p>
          )}
          {generated && data && (
            <button
              onClick={() => window.print()}
              className="px-5 py-2 border border-notion-border rounded-md text-sm font-semibold text-notion-text hover:bg-notion-hover"
            >
              🖨 Print
            </button>
          )}
        </div>
      </div>

      {/* Report output */}
      {generated && data && (
        <div className="print-area">
          {/* Print header — hidden on screen, shown on print */}
          <div className="hidden print:block mb-6">
            <div className="text-xl font-bold">🍱 Mess Tracker — Meal Report</div>
            <div className="text-sm text-gray-600 mt-1">
              {fmtDate(from)} — {fmtDate(to)}
            </div>
          </div>

          {/* Screen header */}
          <div className="no-print flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-notion-text">
                {fmtDate(from)} — {fmtDate(to)}
              </div>
              <div className="label-mono mt-0.5">{data.length} people · {grandMeals} meals delivered</div>
            </div>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-4 gap-0 mb-5 border border-notion-border rounded-md overflow-hidden bg-notion-bg">
            {[
              { label: 'Breakfast', value: grandB,           hide: false },
              { label: 'Lunch',     value: grandL,           hide: false },
              { label: 'Dinner',    value: grandD,           hide: false },
              { label: 'Total',     value: `₹${grandTotal}`, hide: true  }
            ].map((s, i, arr) => (
              <div key={s.label} className={`px-3 py-3 ${i < arr.length-1 ? 'border-r border-notion-border' : ''} ${s.hide ? 'print:hidden' : ''}`}>
                <div className="label-mono">{s.label}</div>
                <div className="stat-value text-lg text-notion-text mt-0.5">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="border border-notion-border rounded-md overflow-hidden bg-notion-bg">
            {/* Header */}
            <div className="grid grid-cols-6 gap-0 border-b border-notion-border bg-notion-bgSoft">
              <div className="col-span-2 px-3 py-2"><span className="label-mono">Name</span></div>
              <div className="px-3 py-2 text-center"><span className="label-mono">B</span></div>
              <div className="px-3 py-2 text-center"><span className="label-mono">L</span></div>
              <div className="px-3 py-2 text-center"><span className="label-mono">D</span></div>
              <div className="px-3 py-2 text-right print:hidden"><span className="label-mono">Amount</span></div>
            </div>

            {/* Rows */}
            {data.map((person, i) => (
              <div
                key={person.id}
                className={`grid grid-cols-6 gap-0 ${i < data.length-1 ? 'border-b border-notion-border' : ''} hover:bg-notion-bgSoft`}
              >
                <div className="col-span-2 px-3 py-2.5 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-notion-hover text-notion-text border border-notion-border flex items-center justify-center chip text-[9px] shrink-0">
                    {person.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-notion-text text-sm truncate">{person.name}</span>
                </div>
                <div className="px-3 py-2.5 text-center">
                  <span className="stat-value text-sm text-notion-text">{person.counts.breakfast || 0}</span>
                </div>
                <div className="px-3 py-2.5 text-center">
                  <span className="stat-value text-sm text-notion-text">{person.counts.lunch || 0}</span>
                </div>
                <div className="px-3 py-2.5 text-center">
                  <span className="stat-value text-sm text-notion-text">{person.counts.dinner || 0}</span>
                </div>
                <div className="px-3 py-2.5 text-right print:hidden">
                  <span className="stat-value text-sm text-notion-text">₹{person.total}</span>
                </div>
              </div>
            ))}

            {/* Grand total row */}
            <div className="grid grid-cols-6 gap-0 border-t-2 border-notion-border bg-notion-bgSoft">
              <div className="col-span-2 px-3 py-2.5">
                <span className="text-sm font-bold text-notion-text">Total</span>
              </div>
              <div className="px-3 py-2.5 text-center">
                <span className="stat-value text-sm font-bold text-notion-text">{grandB}</span>
              </div>
              <div className="px-3 py-2.5 text-center">
                <span className="stat-value text-sm font-bold text-notion-text">{grandL}</span>
              </div>
              <div className="px-3 py-2.5 text-center">
                <span className="stat-value text-sm font-bold text-notion-text">{grandD}</span>
              </div>
              <div className="px-3 py-2.5 text-right print:hidden">
                <span className="stat-value text-sm font-bold text-notion-text">₹{grandTotal}</span>
              </div>
            </div>
          </div>

          {/* Print footer */}
          <div className="hidden print:block mt-6 text-xs text-gray-400 text-right">
            Generated on {fmtDate(localToday())}
          </div>
        </div>
      )}

      {generated && data?.length === 0 && (
        <div className="text-center py-12 border border-dashed border-notion-border rounded-md bg-notion-bg">
          <div className="text-notion-text font-medium">No delivered meals in this range</div>
        </div>
      )}
    </div>
  )
}
