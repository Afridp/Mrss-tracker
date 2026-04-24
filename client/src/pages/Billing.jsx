import React, { useState, useEffect } from 'react'
import { getBilling } from '../api'
import { useProfile } from '../ProfileContext'

const MEAL_PRICES = { breakfast: 30, lunch: 60, dinner: 30 }
const MEAL_ICONS  = { breakfast: '☀️', lunch: '🌤️', dinner: '🌙' }

function toMonthStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function monthDisplay(str) {
  const [y, m] = str.split('-').map(Number)
  return new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export default function Billing() {
  const { profileId } = useProfile()
  const [month, setMonth] = useState(toMonthStr(new Date()))
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const billing = await getBilling(month)
    setData(billing)
    setLoading(false)
  }

  useEffect(() => { load() }, [month])

  function shiftMonth(delta) {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 1 + delta)
    setMonth(toMonthStr(d))
  }

  const currentMonth = toMonthStr(new Date())
  const grandTotal = data.reduce((s, p) => s + p.total, 0)
  const grandMeals = data.reduce((s, p) => s + Object.values(p.counts).reduce((a, b) => a + b, 0), 0)
  const myRow = data.find(p => p.id === profileId)

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4 bg-white/70 rounded-2xl border border-stone-200/60 shadow-sm px-2 py-2">
        <button
          onClick={() => shiftMonth(-1)}
          className="w-10 h-10 rounded-xl hover:bg-stone-100 text-stone-600 text-xl flex items-center justify-center"
        >
          ←
        </button>
        <div className="text-center">
          <div className="text-lg font-bold text-stone-900 tracking-tight">{monthDisplay(month)}</div>
          <div className="text-xs text-stone-400 font-medium uppercase tracking-wide">Billing</div>
        </div>
        <button
          onClick={() => shiftMonth(1)}
          disabled={month >= currentMonth}
          className="w-10 h-10 rounded-xl hover:bg-stone-100 text-stone-600 text-xl flex items-center justify-center disabled:opacity-30 disabled:hover:bg-transparent"
        >
          →
        </button>
      </div>

      {month !== currentMonth && (
        <button
          onClick={() => setMonth(currentMonth)}
          className="w-full mb-4 py-2 text-sm font-medium text-orange-700 bg-orange-50/70 border border-orange-200 rounded-xl hover:bg-orange-100"
        >
          Jump to Current Month
        </button>
      )}

      {/* Summary */}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-5">
          <div className="bg-gradient-to-br from-orange-50 to-rose-100/50 border border-orange-200/50 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-orange-700 tracking-tight">₹{grandTotal}</div>
            <div className="text-[11px] text-orange-600/80 font-medium uppercase tracking-wide mt-0.5">Total Billed</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-emerald-700 tracking-tight">{grandMeals}</div>
            <div className="text-[11px] text-emerald-600/80 font-medium uppercase tracking-wide mt-0.5">Meals Delivered</div>
          </div>
        </div>
      )}

      {/* Your bill callout */}
      {!loading && myRow && myRow.total > 0 && (
        <div className="mb-5 bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl p-4 text-white shadow-lg">
          <div className="text-xs text-orange-200/80 font-medium uppercase tracking-wider mb-1">Your Bill</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight">₹{myRow.total}</span>
            <span className="text-sm text-stone-400">
              · {Object.values(myRow.counts).reduce((a, b) => a + b, 0)} meals
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-stone-400 text-sm">Loading...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-16 bg-white/50 rounded-2xl border border-stone-200/50">
          <div className="text-5xl mb-3">📋</div>
          <div className="text-stone-600 font-medium">No data for this month.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map(person => {
            const hasMeals = Object.values(person.counts).some(c => c > 0)
            const isMe = person.id === profileId
            return (
              <div
                key={person.id}
                className={`rounded-2xl shadow-sm overflow-hidden transition-shadow hover:shadow-md ${
                  isMe ? 'bg-white border-2 border-orange-200' : 'bg-white border border-stone-200/70'
                }`}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-rose-400 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-900">{person.name}</span>
                      {isMe && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-orange-500 text-white rounded-full">YOU</span>}
                    </div>
                  </div>
                  <span className={`text-xl font-bold tracking-tight ${hasMeals ? 'text-orange-600' : 'text-stone-300'}`}>
                    ₹{person.total}
                  </span>
                </div>
                <div className="px-3 py-3 grid grid-cols-3 gap-2">
                  {['breakfast', 'lunch', 'dinner'].map(meal => {
                    if (!person[meal]) return null
                    const count = person.counts[meal] || 0
                    return (
                      <div key={meal} className="bg-stone-50/60 rounded-xl p-2 text-center">
                        <div className="text-[10px] text-stone-400 font-semibold uppercase tracking-wide mb-0.5">
                          {MEAL_ICONS[meal]} {meal.slice(0, 3)}
                        </div>
                        <div className="font-bold text-stone-800">{count}×</div>
                        <div className="text-[11px] text-stone-500">₹{count * MEAL_PRICES[meal]}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl px-4 py-4 flex items-center justify-between shadow-lg mt-4">
            <div>
              <div className="text-white font-bold text-lg">Grand Total</div>
              <div className="text-stone-400 text-xs">{grandMeals} meals · {data.length} people</div>
            </div>
            <div className="text-3xl font-bold text-orange-400 tracking-tight">₹{grandTotal}</div>
          </div>
        </div>
      )}
    </div>
  )
}
