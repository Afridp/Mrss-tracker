import React, { useState, useEffect } from 'react'
import { getBilling } from '../api'
import { useProfile } from '../ProfileContext'

const MEAL_PRICES = { breakfast: 30, lunch: 60, dinner: 30 }

function toMonthStr(date) {
  return date.toISOString().slice(0, 7)
}

function monthDisplay(str) {
  const [y, m] = str.split('-')
  return new Date(+y, +m - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
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

  const grandTotal = data.reduce((s, p) => s + p.total, 0)
  const grandMeals = data.reduce((s, p) => s + Object.values(p.counts).reduce((a, b) => a + b, 0), 0)

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => shiftMonth(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 font-bold text-lg"
        >
          ←
        </button>
        <div className="text-center">
          <div className="text-xl font-bold text-gray-800">{monthDisplay(month)}</div>
          <div className="text-sm text-gray-400">Billing Summary</div>
        </div>
        <button
          onClick={() => shiftMonth(1)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 font-bold text-lg"
          disabled={month >= toMonthStr(new Date())}
        >
          →
        </button>
      </div>

      {month !== toMonthStr(new Date()) && (
        <button
          onClick={() => setMonth(toMonthStr(new Date()))}
          className="w-full mb-4 py-2 text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100"
        >
          Back to Current Month
        </button>
      )}

      {/* Totals */}
      {!loading && data.length > 0 && (
        <div className="flex gap-3 mb-5">
          <div className="flex-1 bg-orange-50 border border-orange-200 rounded-xl px-3 py-3 text-center">
            <div className="text-2xl font-bold text-orange-600">₹{grandTotal}</div>
            <div className="text-xs text-orange-500 mt-0.5">Total Billed</div>
          </div>
          <div className="flex-1 bg-green-50 border border-green-200 rounded-xl px-3 py-3 text-center">
            <div className="text-2xl font-bold text-green-600">{grandMeals}</div>
            <div className="text-xs text-green-500 mt-0.5">Meals Delivered</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📋</div>
          <div className="text-gray-500">No data for this month.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map(person => {
            const hasMeals = Object.values(person.counts).some(c => c > 0)
            const isMe = person.id === profileId
            return (
              <div
                key={person.id}
                className={`rounded-xl shadow-sm overflow-hidden ${
                  isMe
                    ? 'bg-orange-50 border-2 border-orange-300'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-gray-800">{person.name}</span>
                    {isMe && (
                      <span className="text-xs font-bold px-2 py-0.5 bg-orange-500 text-white rounded-full">You</span>
                    )}
                  </div>
                  <span className={`text-lg font-bold ${hasMeals ? 'text-orange-600' : 'text-gray-300'}`}>
                    ₹{person.total}
                  </span>
                </div>
                <div className="px-4 py-3 grid grid-cols-3 gap-2">
                  {['breakfast', 'lunch', 'dinner'].map(meal => {
                    if (!person[meal]) return null
                    const count = person.counts[meal] || 0
                    return (
                      <div key={meal} className="text-center">
                        <div className="text-xs text-gray-400 mb-1">
                          {meal === 'breakfast' ? '☀️' : meal === 'lunch' ? '🌤️' : '🌙'}{' '}
                          {meal.charAt(0).toUpperCase() + meal.slice(1)}
                        </div>
                        <div className="font-semibold text-gray-700">{count}x</div>
                        <div className="text-xs text-gray-400">₹{count * MEAL_PRICES[meal]}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Grand total row */}
          <div className="bg-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-white font-bold">Total</div>
              <div className="text-gray-400 text-xs">{grandMeals} meals across {data.length} people</div>
            </div>
            <div className="text-2xl font-bold text-orange-400">₹{grandTotal}</div>
          </div>
        </div>
      )}
    </div>
  )
}
