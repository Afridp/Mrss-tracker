import React, { useState, useEffect, useCallback } from 'react'
import { getMeals, updateMeal, bulkUpdateMeals } from '../api'
import { useProfile } from '../ProfileContext'

const MEALS = ['breakfast', 'lunch', 'dinner']
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' }
const MEAL_ICONS = { breakfast: '☀️', lunch: '🌤️', dinner: '🌙' }
const MEAL_PRICES = { breakfast: 30, lunch: 60, dinner: 30 }

const STATUS_CYCLE = { pending: 'delivered', delivered: 'skipped', skipped: 'pending' }

const STATUS_STYLE = {
  pending:   'bg-gray-100 text-gray-500 border-gray-200',
  delivered: 'bg-green-100 text-green-700 border-green-300',
  skipped:   'bg-red-100 text-red-500 border-red-200'
}
const STATUS_LABEL = { pending: 'Pending', delivered: '✓ Done', skipped: '✗ Skip' }

function toDateStr(date) {
  return date.toISOString().split('T')[0]
}

function formatDisplay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const today = toDateStr(new Date())
  const yesterday = toDateStr(new Date(Date.now() - 86400000))
  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
}

export default function Dashboard() {
  const { profileId } = useProfile()
  const [dateStr, setDateStr] = useState(toDateStr(new Date()))
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('mine') // 'mine' | 'all'

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
    const d = new Date(dateStr + 'T00:00:00')
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

  const isToday = dateStr === toDateStr(new Date())
  const isFuture = dateStr > toDateStr(new Date())

  const visiblePeople = viewMode === 'mine'
    ? people.filter(p => p.id === profileId)
    : people

  const totalDelivered = visiblePeople.reduce((sum, p) =>
    sum + Object.values(p.meals).filter(s => s === 'delivered').length, 0)
  const totalPending = visiblePeople.reduce((sum, p) =>
    sum + Object.values(p.meals).filter(s => s === 'pending').length, 0)

  return (
    <div>
      {/* Date nav */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => shiftDate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 font-bold text-lg"
        >
          ←
        </button>
        <div className="text-center">
          <div className="text-xl font-bold text-gray-800">{formatDisplay(dateStr)}</div>
          <div className="text-sm text-gray-400">{dateStr}</div>
        </div>
        <button
          onClick={() => shiftDate(1)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 font-bold text-lg"
        >
          →
        </button>
      </div>

      {!isToday && (
        <button
          onClick={() => setDateStr(toDateStr(new Date()))}
          className="w-full mb-4 py-2 text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100"
        >
          Back to Today
        </button>
      )}

      {/* View mode toggle */}
      {!loading && people.length > 0 && (
        <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
          <button
            onClick={() => setViewMode('mine')}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition ${
              viewMode === 'mine' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'
            }`}
          >
            My Meals
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition ${
              viewMode === 'all' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'
            }`}
          >
            Everyone
          </button>
        </div>
      )}

      {/* Summary bar */}
      {!loading && visiblePeople.length > 0 && (
        <div className="flex gap-3 mb-5">
          <div className="flex-1 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
            <div className="text-xl font-bold text-green-700">{totalDelivered}</div>
            <div className="text-xs text-green-600">Delivered</div>
          </div>
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-center">
            <div className="text-xl font-bold text-gray-500">{totalPending}</div>
            <div className="text-xs text-gray-400">Pending</div>
          </div>
          <div className="flex-1 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-center">
            <div className="text-xl font-bold text-orange-600">
              ₹{visiblePeople.reduce((sum, p) =>
                sum + Object.entries(p.meals)
                  .filter(([, s]) => s === 'delivered')
                  .reduce((s, [m]) => s + (MEAL_PRICES[m] || 0), 0), 0)}
            </div>
            <div className="text-xs text-orange-500">
              {viewMode === 'mine' ? 'Your cost' : "Today's cost"}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : people.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">👥</div>
          <div className="text-gray-500">No people added yet.</div>
          <div className="text-sm text-gray-400 mt-1">Go to People tab to add roommates.</div>
        </div>
      ) : visiblePeople.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Your profile wasn't found.</div>
          <button
            onClick={() => setViewMode('all')}
            className="mt-3 text-sm text-orange-600 hover:underline"
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

            return (
              <div key={person.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-gray-800">{person.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {personCost > 0 && (
                      <span className="text-sm font-medium text-orange-600">₹{personCost}</span>
                    )}
                    {!allDone && !isFuture && (
                      <button
                        onClick={() => markAllDelivered(person.id)}
                        className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 font-medium"
                      >
                        All Done
                      </button>
                    )}
                  </div>
                </div>
                <div className="px-4 py-3 flex gap-2 flex-wrap">
                  {MEALS.filter(m => person.meals.hasOwnProperty(m)).map(meal => {
                    const status = person.meals[meal]
                    return (
                      <button
                        key={meal}
                        onClick={() => toggleMeal(person.id, meal, status)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${STATUS_STYLE[status]}`}
                      >
                        <span>{MEAL_ICONS[meal]}</span>
                        <span>{MEAL_LABELS[meal]}</span>
                        <span className="text-xs opacity-75">{STATUS_LABEL[status]}</span>
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
