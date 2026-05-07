import React, { useState, useEffect, useCallback } from 'react'
import { getBookings, setBooking, getPeople, MEAL_PRICES } from '../api'
import { useProfile } from '../ProfileContext'
import { useAuth } from '../AuthContext'

const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' }
const MEAL_ICONS  = { breakfast: '☀', lunch: '◐', dinner: '☾' }
const CUTOFF_HOUR = 22 // 10 PM

function toDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getTomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return toDateStr(d)
}

function fmtDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'short'
  })
}

function isOpen() {
  return new Date().getHours() < CUTOFF_HOUR
}

function timeLeft() {
  const now = new Date()
  const cutoff = new Date()
  cutoff.setHours(CUTOFF_HOUR, 0, 0, 0)
  const diff = cutoff - now
  if (diff <= 0) return null
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`
}

export default function Booking() {
  const { profile, profileId } = useProfile()
  const { isAdmin } = useAuth()

  const tomorrow = getTomorrow()
  const open = isOpen()
  const remaining = timeLeft()

  const [myBookings, setMyBookings]     = useState({}) // { meal: booked }
  const [allBookings, setAllBookings]   = useState([]) // raw docs
  const [people, setPeople]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(null) // meal being saved

  const load = useCallback(async () => {
    setLoading(true)
    const [bookings, ppl] = await Promise.all([
      getBookings(tomorrow),
      isAdmin ? getPeople() : Promise.resolve([])
    ])
    setAllBookings(bookings)
    setPeople(ppl)

    // Build my booking map
    if (profileId) {
      const mine = {}
      bookings.filter(b => b.personId === profileId).forEach(b => {
        mine[b.meal] = b.booked
      })
      setMyBookings(mine)
    }
    setLoading(false)
  }, [tomorrow, profileId, isAdmin])

  useEffect(() => { load() }, [load])

  async function toggleBooking(meal) {
    if (!open || !profileId) return
    const next = !myBookings[meal]
    setMyBookings(prev => ({ ...prev, [meal]: next }))
    setSaving(meal)
    await setBooking(profileId, tomorrow, meal, next)
    setSaving(null)
    // Refresh all bookings so admin count updates
    const updated = await getBookings(tomorrow)
    setAllBookings(updated)
  }

  // Admin: count booked meals per type
  const counts = { breakfast: 0, lunch: 0, dinner: 0 }
  allBookings.filter(b => b.booked).forEach(b => {
    if (counts[b.meal] !== undefined) counts[b.meal]++
  })
  const totalOrders = Object.values(counts).reduce((a, b) => a + b, 0)

  // Admin: per-person breakdown
  const personBookingMap = {}
  allBookings.filter(b => b.booked).forEach(b => {
    if (!personBookingMap[b.personId]) personBookingMap[b.personId] = []
    personBookingMap[b.personId].push(b.meal)
  })

  const myMeals = profile
    ? ['breakfast', 'lunch', 'dinner'].filter(m => profile[m])
    : []

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-notion-text tracking-tight">Book for Tomorrow</h1>
        <div className="label-mono mt-1">{fmtDate(tomorrow)}</div>
      </div>

      {/* Booking status banner */}
      <div className={`rounded-md px-4 py-3 mb-5 flex items-center justify-between ${
        open
          ? 'bg-notion-bgSoft border border-notion-border'
          : 'bg-notion-text text-notion-bg'
      }`}>
        <div>
          <div className={`text-sm font-semibold ${open ? 'text-notion-text' : 'text-notion-bg'}`}>
            {open ? 'Booking is open' : 'Booking closed for tonight'}
          </div>
          <div className={`label-mono mt-0.5 ${open ? '' : 'opacity-60'}`}>
            {open
              ? `Closes at 10:00 PM tonight${remaining ? ` · ${remaining}` : ''}`
              : 'No more changes — order placed at 10 PM'}
          </div>
        </div>
        {open && (
          <div className="w-2 h-2 rounded-full bg-notion-text animate-pulse" />
        )}
      </div>

      {/* Admin order summary */}
      {isAdmin && !loading && (
        <div className="mb-5">
          <div className="label-mono mb-2">Tomorrow's order count</div>
          <div className="grid grid-cols-3 gap-0 border border-notion-border rounded-md overflow-hidden bg-notion-bg mb-3">
            {['breakfast', 'lunch', 'dinner'].map((meal, i, arr) => (
              <div key={meal} className={`px-3 py-3 ${i < arr.length - 1 ? 'border-r border-notion-border' : ''}`}>
                <div className="label-mono">{MEAL_LABELS[meal]}</div>
                <div className="stat-value text-2xl text-notion-text mt-1">{counts[meal]}</div>
                <div className="label-mono mt-0.5">×₹{MEAL_PRICES[meal]}</div>
              </div>
            ))}
          </div>

          {/* Per-person breakdown */}
          {totalOrders > 0 && (
            <div className="divide-y divide-notion-border border border-notion-border rounded-md overflow-hidden bg-notion-bg">
              {people
                .filter(p => personBookingMap[p.id]?.length > 0)
                .map(person => (
                  <div key={person.id} className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-notion-hover text-notion-text border border-notion-border flex items-center justify-center chip shrink-0">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-notion-text text-sm">{person.name}</span>
                    </div>
                    <div className="flex gap-1">
                      {personBookingMap[person.id].map(meal => (
                        <span key={meal} className="chip px-1.5 py-0.5 bg-notion-hover text-notion-subtle rounded border border-notion-border">
                          {MEAL_LABELS[meal].charAt(0)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {totalOrders === 0 && (
            <div className="text-center py-6 border border-dashed border-notion-border rounded-md bg-notion-bg">
              <div className="text-notion-subtle text-sm">No one has booked yet</div>
            </div>
          )}
        </div>
      )}

      {/* User's booking */}
      {loading ? (
        <div className="text-center py-8 text-notion-light text-sm">Loading...</div>
      ) : !profile ? (
        <div className="text-center py-8 text-notion-subtle text-sm">Profile not found.</div>
      ) : (
        <div>
          <div className="label-mono mb-2">Your meals for tomorrow</div>
          <div className="divide-y divide-notion-border border border-notion-border rounded-md overflow-hidden bg-notion-bg">
            {myMeals.length === 0 ? (
              <div className="px-4 py-6 text-center text-notion-subtle text-sm">No meals in your plan.</div>
            ) : myMeals.map(meal => {
              const booked = !!myBookings[meal]
              const isSaving = saving === meal
              return (
                <button
                  key={meal}
                  onClick={() => toggleBooking(meal)}
                  disabled={!open || isSaving}
                  className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors disabled:cursor-not-allowed ${
                    booked ? 'bg-notion-text' : 'hover:bg-notion-hover'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-lg ${booked ? 'opacity-80' : 'text-notion-subtle'}`}>
                      {MEAL_ICONS[meal]}
                    </span>
                    <div className="text-left">
                      <div className={`font-medium text-sm ${booked ? 'text-notion-bg' : 'text-notion-text'}`}>
                        {MEAL_LABELS[meal]}
                      </div>
                      <div className={`stat-value text-[11px] ${booked ? 'text-notion-bg opacity-60' : 'text-notion-subtle'}`}>
                        ₹{MEAL_PRICES[meal]}
                      </div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 ${booked ? 'text-notion-bg' : 'text-notion-light'}`}>
                    {isSaving ? (
                      <span className="chip opacity-60">saving...</span>
                    ) : (
                      <>
                        <span className={`chip ${booked ? 'opacity-70' : 'opacity-40'}`}>
                          {booked ? '✓ booked' : open ? 'tap to book' : 'not booked'}
                        </span>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          booked
                            ? 'bg-notion-bg border-notion-bg'
                            : 'border-notion-border'
                        }`}>
                          {booked && <span className="text-notion-text text-[10px] font-bold">✓</span>}
                        </div>
                      </>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {!open && (
            <p className="text-xs text-notion-light text-center mt-3">
              Bookings closed at 10:00 PM. See you tomorrow!
            </p>
          )}
        </div>
      )}
    </div>
  )
}
