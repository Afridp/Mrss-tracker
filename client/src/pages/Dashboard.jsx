import React, { useState, useEffect, useCallback } from 'react'
import { getMeals, updateMeal, bulkUpdateMeals } from '../api'
import { useProfile } from '../ProfileContext'

const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' }
const MEAL_ICONS  = { breakfast: '☀️', lunch: '🌤️', dinner: '🌙' }
const MEAL_PRICES = { breakfast: 30, lunch: 60, dinner: 30 }

const STATUS_CYCLE = { pending: 'delivered', delivered: 'skipped', skipped: 'pending' }

const STATUS_STYLE = {
  pending:   'bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-300',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:border-emerald-400',
  skipped:   'bg-rose-50 text-rose-600 border-rose-200 hover:border-rose-300'
}
const STATUS_LABEL = { pending: 'Pending', delivered: '✓ Done', skipped: '✗ Skipped' }

// Local-date helpers (avoid toISOString UTC shift)
function toDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseDateStr(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDisplay(dateStr) {
  const d = parseDateStr(dateStr)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)

  if (toDateStr(d) === toDateStr(today)) return 'Today'
  if (toDateStr(d) === toDateStr(yesterday)) return 'Yesterday'
  if (toDateStr(d) === toDateStr(tomorrow)) return 'Tomorrow'
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
}

export default function Dashboard() {
  const { profileId } = useProfile()
  const [dateStr, setDateStr] = useState(toDateStr(new Date()))
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('mine')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getMeals(dateStr)
      setPeople(data)
    } finally {
      setLoading(false)
    }
  }, [dateStr])

  useEffect(() => { load() }, [load])

  function shiftDate(days) {
    const d = parseDateStr(dateStr)
    d.setDate(d.getDate() + days)
    setDateStr(toDateStr(d))
  }

  async function toggleMeal(personId, meal, currentStatus) {
    const next = STATUS_CYCLE[currentStatus] || 'pending'
    setPeople(prev =>
      prev.map(p =>
        p.id === personId ? { ...p, meals: { ...p.meals, [meal]: next } } : p
      )
    )
    await updateMeal({ personId, date: dateStr, meal, status: next })
  }

  async function markAllDelivered(personId) {
    setPeople(prev =>
      prev.map(p => {
        if (p.id !== personId) return p
        const meals = {}
        Object.keys(p.meals).forEach(m => { meals[m] = 'delivered' })
        return { ...p, meals }
      })
    )
    await bulkUpdateMeals({ personId, date: dateStr, status: 'delivered' })
  }

  const today = toDateStr(new Date())
  const isToday = dateStr === today
  const isFuture = dateStr > today

  const visiblePeople = viewMode === 'mine'
    ? people.filter(p => p.id === profileId)
    : people

  const totalDelivered = visiblePeople.reduce((sum, p) =>
    sum + Object.values(p.meals).filter(s => s === 'delivered').length, 0)
  const totalPending = visiblePeople.reduce((sum, p) =>
    sum + Object.values(p.meals).filter(s => s === 'pending').length, 0)
  const totalCost = visiblePeople.reduce((sum, p) =>
    sum + Object.entries(p.meals)
      .filter(([, s]) => s === 'delivered')
      .reduce((s, [m]) => s + (MEAL_PRICES[m] || 0), 0), 0)

  return (
    <div>
      {/* Date nav */}
      <div className="flex items-center justify-between mb-4 bg-white/70 rounded-2xl border border-stone-200/60 shadow-sm px-2 py-2">
        <button
          onClick={() => shiftDate(-1)}
          className="w-10 h-10 rounded-xl hover:bg-stone-100 text-stone-600 text-xl flex items-center justify-center"
        >
          ←
        </button>
        <div className="text-center">
          <div className="text-lg font-bold text-stone-900 tracking-tight">{formatDisplay(dateStr)}</div>
          <div className="text-xs text-stone-400 font-medium">{dateStr}</div>
        </div>
        <button
          onClick={() => shiftDate(1)}
          className="w-10 h-10 rounded-xl hover:bg-stone-100 text-stone-600 text-xl flex items-center justify-center"
        >
          →
        </button>
      </div>

      {!isToday && (
        <button
          onClick={() => setDateStr(toDateStr(new Date()))}
          className="w-full mb-4 py-2 text-sm font-medium text-orange-700 bg-orange-50/70 border border-orange-200 rounded-xl hover:bg-orange-100"
        >
          Jump to Today
        </button>
      )}

      {/* View toggle */}
      {!loading && people.length > 0 && (
        <div className="flex bg-stone-100/80 rounded-2xl p-1 mb-4">
          <button
            onClick={() => setViewMode('mine')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              viewMode === 'mine' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'
            }`}
          >
            My Meals
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              viewMode === 'all' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'
            }`}
          >
            Everyone
          </button>
        </div>
      )}

      {/* Summary */}
      {!loading && visiblePeople.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50 rounded-2xl p-3 text-center">
            <div className="text-2xl font-bold text-emerald-700 tracking-tight">{totalDelivered}</div>
            <div className="text-[11px] text-emerald-600/80 font-medium uppercase tracking-wide">Delivered</div>
          </div>
          <div className="bg-gradient-to-br from-stone-50 to-stone-100/50 border border-stone-200/50 rounded-2xl p-3 text-center">
            <div className="text-2xl font-bold text-stone-600 tracking-tight">{totalPending}</div>
            <div className="text-[11px] text-stone-500 font-medium uppercase tracking-wide">Pending</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-rose-100/50 border border-orange-200/50 rounded-2xl p-3 text-center">
            <div className="text-2xl font-bold text-orange-700 tracking-tight">₹{totalCost}</div>
            <div className="text-[11px] text-orange-600/80 font-medium uppercase tracking-wide">
              {viewMode === 'mine' ? 'Your cost' : 'Total'}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-stone-400 text-sm">Loading...</div>
      ) : people.length === 0 ? (
        <div className="text-center py-16 bg-white/50 rounded-2xl border border-stone-200/50">
          <div className="text-5xl mb-3">👥</div>
          <div className="text-stone-600 font-medium">No people added yet.</div>
          <div className="text-sm text-stone-400 mt-1">Head to the People tab to add roommates.</div>
        </div>
      ) : visiblePeople.length === 0 ? (
        <div className="text-center py-12 bg-white/50 rounded-2xl border border-stone-200/50">
          <div className="text-stone-500">Your profile wasn't found.</div>
          <button
            onClick={() => setViewMode('all')}
            className="mt-3 text-sm text-orange-600 font-medium hover:underline"
          >
            Show everyone instead
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {visiblePeople.map(person => {
            const allDone = Object.values(person.meals).every(s => s === 'delivered')
            const personCost = Object.entries(person.meals)
              .filter(([, s]) => s === 'delivered')
              .reduce((sum, [m]) => sum + (MEAL_PRICES[m] || 0), 0)
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
                  <div className="flex items-center gap-2">
                    {personCost > 0 && (
                      <span className="text-sm font-bold text-orange-600">₹{personCost}</span>
                    )}
                    {!allDone && !isFuture && (
                      <button
                        onClick={() => markAllDelivered(person.id)}
                        className="text-[11px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200"
                      >
                        All Done
                      </button>
                    )}
                  </div>
                </div>
                <div className="px-3 py-3 flex gap-2 flex-wrap">
                  {['breakfast', 'lunch', 'dinner'].filter(m => person.meals.hasOwnProperty(m)).map(meal => {
                    const status = person.meals[meal]
                    return (
                      <button
                        key={meal}
                        onClick={() => toggleMeal(person.id, meal, status)}
                        className={`flex-1 flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl border-2 font-medium ${STATUS_STYLE[status]}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{MEAL_ICONS[meal]}</span>
                          <span className="text-sm">{MEAL_LABELS[meal]}</span>
                        </div>
                        <span className="text-[11px] font-bold opacity-80">{STATUS_LABEL[status]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
