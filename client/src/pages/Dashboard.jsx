import React, { useState, useEffect, useCallback } from 'react'
import { getMeals, updateMeal, bulkUpdateMeals } from '../api'
import { useProfile } from '../ProfileContext'
import { useAuth } from '../AuthContext'

const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' }
const MEAL_ICONS  = { breakfast: '☀', lunch: '◐', dinner: '☾' }
const MEAL_PRICES = { breakfast: 30, lunch: 60, dinner: 30 }

const STATUS_CYCLE = { pending: 'delivered', delivered: 'pending' }

const STATUS_STYLE = {
  pending:   'bg-notion-bg text-notion-subtle border-2 border-notion-border hover:bg-notion-hover',
  delivered: 'bg-notion-text text-notion-bg border-2 border-notion-text'
}

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
  const { isAdmin } = useAuth()
  const [dateStr, setDateStr] = useState(toDateStr(new Date()))
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState(isAdmin ? 'all' : 'mine')

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
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => shiftDate(-1)}
          className="w-8 h-8 rounded-md hover:bg-notion-hover text-notion-subtle flex items-center justify-center"
        >
          ←
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-notion-text tracking-tight">{formatDisplay(dateStr)}</h1>
          <div className="label-mono mt-1">{dateStr}</div>
        </div>
        <button
          onClick={() => shiftDate(1)}
          disabled={isToday}
          className="w-8 h-8 rounded-md hover:bg-notion-hover text-notion-subtle flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed"
        >
          →
        </button>
      </div>

      {!isToday && (
        <button
          onClick={() => setDateStr(toDateStr(new Date()))}
          className="w-full mb-4 py-1.5 text-sm text-notion-text hover:bg-notion-hover rounded-md font-medium border border-notion-border bg-notion-bg"
        >
          Jump to today
        </button>
      )}

      {/* View toggle — admin only */}
      {isAdmin && !loading && people.length > 0 && (
        <div className="inline-flex bg-notion-bg border border-notion-border rounded-md p-0.5 mb-5">
          <button
            onClick={() => setViewMode('mine')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              viewMode === 'mine' ? 'bg-notion-hover text-notion-text' : 'text-notion-subtle hover:text-notion-text'
            }`}
          >
            My meals
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              viewMode === 'all' ? 'bg-notion-hover text-notion-text' : 'text-notion-subtle hover:text-notion-text'
            }`}
          >
            Everyone
          </button>
        </div>
      )}

      {/* Summary */}
      {!loading && visiblePeople.length > 0 && (
        <div className="grid grid-cols-3 gap-0 mb-6 border border-notion-border rounded-md overflow-hidden bg-notion-bg">
          <div className="px-3 py-3 border-r border-notion-border">
            <div className="label-mono">Delivered</div>
            <div className="stat-value text-xl text-notion-text mt-1">{totalDelivered}</div>
          </div>
          <div className="px-3 py-3 border-r border-notion-border">
            <div className="label-mono">Pending</div>
            <div className="stat-value text-xl text-notion-text mt-1">{totalPending}</div>
          </div>
          <div className="px-3 py-3">
            <div className="label-mono">{viewMode === 'mine' ? 'Your cost' : 'Total cost'}</div>
            <div className="stat-value text-xl text-notion-text mt-1">₹{totalCost}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-notion-light text-sm">Loading...</div>
      ) : people.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-notion-border rounded-md bg-notion-bg">
          <div className="text-3xl mb-2">·</div>
          <div className="text-notion-text font-medium">No people added yet</div>
          <div className="text-sm text-notion-subtle mt-1">Head to the People tab to add roommates.</div>
        </div>
      ) : visiblePeople.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-notion-border rounded-md bg-notion-bg">
          <div className="text-notion-text">Your profile wasn't found.</div>
          <button
            onClick={() => setViewMode('all')}
            className="mt-2 text-sm text-notion-text font-medium underline"
          >
            Show everyone
          </button>
        </div>
      ) : (
        <div className="divide-y divide-notion-border border border-notion-border rounded-md overflow-hidden bg-notion-bg">
          {visiblePeople.map(person => {
            const allDone = Object.values(person.meals).every(s => s === 'delivered')
            const personCost = Object.entries(person.meals)
              .filter(([, s]) => s === 'delivered')
              .reduce((sum, [m]) => sum + (MEAL_PRICES[m] || 0), 0)
            const isMe = person.id === profileId

            return (
              <div key={person.id} className="hover:bg-notion-bgSoft">
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-notion-hover text-notion-text flex items-center justify-center chip shrink-0 border border-notion-border">
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-notion-text truncate">{person.name}</span>
                    {isMe && (
                      <span className="chip px-1.5 py-0.5 bg-notion-text text-notion-bg rounded">
                        You
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {personCost > 0 && (
                      <span className="stat-value text-sm text-notion-text">₹{personCost}</span>
                    )}
                    {!allDone && !isFuture && (
                      <button
                        onClick={() => markAllDelivered(person.id)}
                        className="text-[11px] font-medium px-2 py-1 text-notion-subtle hover:text-notion-text hover:bg-notion-hover rounded"
                      >
                        All done
                      </button>
                    )}
                  </div>
                </div>
                <div className="px-3 pb-3 flex gap-1.5">
                  {['breakfast', 'lunch', 'dinner'].filter(m => person.meals.hasOwnProperty(m)).map(meal => {
                    const status = person.meals[meal]
                    const done = status === 'delivered'
                    return (
                      <button
                        key={meal}
                        onClick={() => toggleMeal(person.id, meal, status)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg active:scale-95 transition-transform ${STATUS_STYLE[status]}`}
                      >
                        <span className="text-sm">{MEAL_ICONS[meal]}</span>
                        <span className="text-xs font-semibold">{MEAL_LABELS[meal]}</span>
                        {done && <span className="chip text-[9px] opacity-60">✓</span>}
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
