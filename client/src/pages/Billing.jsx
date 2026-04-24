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
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => shiftMonth(-1)}
          className="w-8 h-8 rounded-md hover:bg-notion-hover text-notion-subtle flex items-center justify-center"
        >
          ←
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-notion-text tracking-tight">{monthDisplay(month)}</h1>
          <div className="text-xs text-notion-light mt-0.5">Billing</div>
        </div>
        <button
          onClick={() => shiftMonth(1)}
          disabled={month >= currentMonth}
          className="w-8 h-8 rounded-md hover:bg-notion-hover text-notion-subtle flex items-center justify-center disabled:opacity-30 disabled:hover:bg-transparent"
        >
          →
        </button>
      </div>

      {month !== currentMonth && (
        <button
          onClick={() => setMonth(currentMonth)}
          className="w-full mb-4 py-1.5 text-sm text-notion-blue hover:bg-notion-blueBg rounded-md font-medium"
        >
          Jump to current month
        </button>
      )}

      {/* Your bill callout */}
      {!loading && myRow && (
        <div className="mb-5 bg-notion-blueBg/50 border border-notion-blueBg rounded-md px-4 py-3">
          <div className="text-xs text-notion-blue font-semibold mb-0.5">YOUR BILL</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-notion-text tracking-tight">₹{myRow.total}</span>
            <span className="text-sm text-notion-subtle">
              · {Object.values(myRow.counts).reduce((a, b) => a + b, 0)} meals
            </span>
          </div>
        </div>
      )}

      {/* Summary */}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-2 gap-0 mb-6 border border-notion-border rounded-md overflow-hidden">
          <div className="px-3 py-3 border-r border-notion-border">
            <div className="text-xs text-notion-subtle font-medium">Total billed</div>
            <div className="text-xl font-bold text-notion-text mt-0.5">₹{grandTotal}</div>
          </div>
          <div className="px-3 py-3">
            <div className="text-xs text-notion-subtle font-medium">Meals delivered</div>
            <div className="text-xl font-bold text-notion-text mt-0.5">{grandMeals}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-notion-light text-sm">Loading...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-notion-border rounded-md">
          <div className="text-3xl mb-2">📋</div>
          <div className="text-notion-text font-medium">No data for this month</div>
        </div>
      ) : (
        <div>
          <div className="divide-y divide-notion-border border border-notion-border rounded-md overflow-hidden">
            {data.map(person => {
              const hasMeals = Object.values(person.counts).some(c => c > 0)
              const isMe = person.id === profileId
              return (
                <div key={person.id} className="bg-white hover:bg-notion-bgSoft">
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-notion-orangeBg text-notion-orange flex items-center justify-center font-semibold text-xs shrink-0">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-notion-text truncate">{person.name}</span>
                      {isMe && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-notion-blueBg text-notion-blue rounded">
                          You
                        </span>
                      )}
                    </div>
                    <span className={`text-base font-semibold tracking-tight ${hasMeals ? 'text-notion-text' : 'text-notion-light'}`}>
                      ₹{person.total}
                    </span>
                  </div>
                  <div className="px-3 pb-3 flex gap-1.5">
                    {['breakfast', 'lunch', 'dinner'].map(meal => {
                      if (!person[meal]) return null
                      const count = person.counts[meal] || 0
                      return (
                        <div key={meal} className="flex-1 bg-notion-bgSoft border border-notion-border rounded px-2 py-1.5 flex items-center justify-between">
                          <span className="text-xs text-notion-subtle">
                            {MEAL_ICONS[meal]} {meal.slice(0, 1).toUpperCase() + meal.slice(1, 3)}
                          </span>
                          <span className="text-xs font-semibold text-notion-text">
                            {count}× · ₹{count * MEAL_PRICES[meal]}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 border border-notion-border rounded-md px-4 py-3 flex items-center justify-between bg-notion-bgSoft">
            <div>
              <div className="font-semibold text-notion-text">Grand total</div>
              <div className="text-xs text-notion-subtle">{grandMeals} meals · {data.length} people</div>
            </div>
            <div className="text-2xl font-bold text-notion-text tracking-tight">₹{grandTotal}</div>
          </div>
        </div>
      )}
    </div>
  )
}
