import React, { useState, useEffect, useCallback } from 'react'
import { getBookings, setBooking, getPeople, MEAL_PRICES } from '../api'
import { useProfile } from '../ProfileContext'
import { useAuth } from '../AuthContext'

const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' }
const MEAL_ICONS  = { breakfast: '☀', lunch: '◐', dinner: '☾' }
const CUTOFF_HOUR = 22

// ── Date helpers ────────────────────────────────────────────────────

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

function getToday()    { return toDateStr(new Date()) }
function getTomorrow() {
  const d = new Date(); d.setDate(d.getDate() + 1); return toDateStr(d)
}

function getThisSunday() {
  const today = new Date(); today.setHours(0,0,0,0)
  const dow = today.getDay() // 0=Sun
  const daysUntilSun = dow === 0 ? 7 : 7 - dow
  const sun = new Date(today); sun.setDate(today.getDate() + daysUntilSun)
  return toDateStr(sun)
}

// All days from tomorrow to this Sunday
function getWeekDates() {
  const today = new Date(); today.setHours(0,0,0,0)
  const sunday = parseDateStr(getThisSunday())
  const dates = []
  for (let d = new Date(today); d <= sunday; d.setDate(d.getDate() + 1)) {
    if (toDateStr(d) !== toDateStr(today)) dates.push(toDateStr(new Date(d)))
  }
  return dates
}

function fmtLong(str) {
  const [y,m,d] = str.split('-').map(Number)
  return new Date(y,m-1,d).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'short' })
}

function fmtChip(str) {
  const [y,m,d] = str.split('-').map(Number)
  const dt = new Date(y,m-1,d)
  const dow = dt.toLocaleDateString('en-IN', { weekday:'short' })
  return { dow, day: d }
}

// Booking for a date is open until 10 PM the previous night
function isDateOpen(dateStr) {
  const now   = new Date()
  const today = new Date(); today.setHours(0,0,0,0)
  const target = parseDateStr(dateStr)
  if (target <= today) return false
  const daysDiff = Math.round((target - today) / 86400000)
  if (daysDiff === 1) return now.getHours() < CUTOFF_HOUR
  return true
}

function timeLeftTonight() {
  const now = new Date()
  if (now.getHours() >= CUTOFF_HOUR) return null
  const cutoff = new Date(); cutoff.setHours(CUTOFF_HOUR, 0, 0, 0)
  const diff = cutoff - now
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`
}

// ── Component ────────────────────────────────────────────────────────

export default function Booking() {
  const { profile, profileId } = useProfile()
  const { isAdmin } = useAuth()

  const today   = getToday()
  const tomorrow = getTomorrow()
  const sunday  = getThisSunday()
  const weekDates = getWeekDates()

  // Admin defaults to today, users to tomorrow
  const [selectedDate, setSelectedDate] = useState(isAdmin ? today : tomorrow)
  const [myBookings,   setMyBookings]   = useState({})
  const [allBookings,  setAllBookings]  = useState([])
  const [people,       setPeople]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [bookings, ppl] = await Promise.all([
      getBookings(selectedDate),
      isAdmin ? getPeople() : Promise.resolve([])
    ])
    setAllBookings(bookings)
    setPeople(ppl)
    if (profileId) {
      const mine = {}
      bookings.filter(b => b.personId === profileId).forEach(b => { mine[b.meal] = b.booked })
      setMyBookings(mine)
    }
    setLoading(false)
  }, [selectedDate, profileId, isAdmin])

  useEffect(() => { load() }, [load])

  async function toggleBooking(meal) {
    if (!isDateOpen(selectedDate) || !profileId) return
    const next = !myBookings[meal]
    setMyBookings(prev => ({ ...prev, [meal]: next }))
    setSaving(meal)
    await setBooking(profileId, selectedDate, meal, next)
    setSaving(null)
    const updated = await getBookings(selectedDate)
    setAllBookings(updated)
  }

  // Admin date navigation
  function shiftDate(days) {
    const d = parseDateStr(selectedDate)
    d.setDate(d.getDate() + days)
    setSelectedDate(toDateStr(d))
  }

  const open       = isDateOpen(selectedDate)
  const remaining  = selectedDate === tomorrow ? timeLeftTonight() : null
  const isPast     = selectedDate <= today

  // Counts for admin
  const counts = { breakfast: 0, lunch: 0, dinner: 0 }
  allBookings.filter(b => b.booked).forEach(b => { if (counts[b.meal] !== undefined) counts[b.meal]++ })
  const totalOrders = Object.values(counts).reduce((a, b) => a + b, 0)

  const personBookingMap = {}
  allBookings.filter(b => b.booked).forEach(b => {
    if (!personBookingMap[b.personId]) personBookingMap[b.personId] = []
    personBookingMap[b.personId].push(b.meal)
  })

  const myMeals = profile ? ['breakfast','lunch','dinner'].filter(m => profile[m]) : []

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-notion-text tracking-tight">
          {isAdmin ? 'Bookings' : 'Book meals'}
        </h1>
        <div className="label-mono mt-1">
          {isAdmin ? 'View bookings for any day' : 'Pre-book your meals for the week'}
        </div>
      </div>

      {/* ── Admin date nav ─────────────────────────────────── */}
      {isAdmin && (
        <div className="flex items-center justify-between mb-4 bg-notion-bg border border-notion-border rounded-md px-2 py-2">
          <button
            onClick={() => shiftDate(-1)}
            className="w-8 h-8 rounded-md hover:bg-notion-hover text-notion-subtle flex items-center justify-center"
          >←</button>
          <div className="text-center">
            <div className="font-bold text-notion-text tracking-tight">{fmtLong(selectedDate)}</div>
            <div className="label-mono mt-0.5">
              {selectedDate === today ? 'Today' : selectedDate === tomorrow ? 'Tomorrow' : ''}
            </div>
          </div>
          <button
            onClick={() => shiftDate(1)}
            className="w-8 h-8 rounded-md hover:bg-notion-hover text-notion-subtle flex items-center justify-center"
          >→</button>
        </div>
      )}

      {/* ── User week strip ─────────────────────────────────── */}
      {!isAdmin && (
        <div className="flex gap-1.5 mb-5 overflow-x-auto scrollbar-hide pb-1">
          {weekDates.map(date => {
            const { dow, day } = fmtChip(date)
            const isSelected  = date === selectedDate
            const dateOpen    = isDateOpen(date)
            const hasBooking  = myBookings && ['breakfast','lunch','dinner']
              .some(m => profile?.[m] && allBookings.find(b => b.personId === profileId && b.date === date && b.meal === m && b.booked))

            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border transition-colors ${
                  isSelected
                    ? 'bg-notion-text text-notion-bg border-notion-text'
                    : 'bg-notion-bg border-notion-border hover:bg-notion-hover text-notion-text'
                }`}
              >
                <span className={`chip text-[9px] ${isSelected ? 'opacity-60' : 'text-notion-subtle'}`}>{dow}</span>
                <span className="text-base font-bold tracking-tight mt-0.5">{day}</span>
                <span className={`text-[8px] mt-0.5 ${isSelected ? 'opacity-50' : 'text-notion-light'}`}>
                  {!dateOpen ? 'closed' : hasBooking ? '·' : ''}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Booking status banner ───────────────────────────── */}
      {!isAdmin && (
        <div className={`rounded-md px-4 py-2.5 mb-4 flex items-center justify-between ${
          open ? 'bg-notion-bgSoft border border-notion-border' : 'bg-notion-text'
        }`}>
          <div>
            <div className={`text-sm font-semibold ${open ? 'text-notion-text' : 'text-notion-bg'}`}>
              {open ? (isPast ? 'Booking closed' : 'Booking open') : 'Booking closed'}
            </div>
            <div className={`label-mono mt-0.5 ${open ? '' : 'text-notion-bg opacity-60'}`}>
              {open && remaining ? `Closes at 10 PM tonight · ${remaining}` :
               open ? 'Open — closes at 10 PM the night before' :
               'No more changes for this day'}
            </div>
          </div>
          {open && <div className="w-2 h-2 rounded-full bg-notion-text animate-pulse" />}
        </div>
      )}

      {/* ── Admin order summary ─────────────────────────────── */}
      {isAdmin && !loading && (
        <div className="mb-5">
          {isPast && selectedDate !== today && (
            <div className="label-mono mb-2 text-notion-light">Past date — showing recorded bookings</div>
          )}
          <div className="label-mono mb-2">Order count for {fmtLong(selectedDate)}</div>
          <div className="grid grid-cols-3 gap-0 border border-notion-border rounded-md overflow-hidden bg-notion-bg mb-3">
            {['breakfast','lunch','dinner'].map((meal, i, arr) => (
              <div key={meal} className={`px-3 py-3 ${i < arr.length-1 ? 'border-r border-notion-border' : ''}`}>
                <div className="label-mono">{MEAL_LABELS[meal]}</div>
                <div className="stat-value text-2xl text-notion-text mt-1">{counts[meal]}</div>
                <div className="label-mono mt-0.5 normal-case tracking-normal text-[10px]">
                  ₹{counts[meal] * MEAL_PRICES[meal]}
                </div>
              </div>
            ))}
          </div>

          {totalOrders > 0 ? (
            <div className="divide-y divide-notion-border border border-notion-border rounded-md overflow-hidden bg-notion-bg">
              {people.filter(p => personBookingMap[p.id]?.length > 0).map(person => (
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
          ) : (
            <div className="text-center py-6 border border-dashed border-notion-border rounded-md bg-notion-bg">
              <div className="text-notion-subtle text-sm">No bookings for this day</div>
            </div>
          )}
        </div>
      )}

      {/* ── User meal toggles ───────────────────────────────── */}
      {!isAdmin && (
        loading ? (
          <div className="text-center py-8 text-notion-light text-sm">Loading...</div>
        ) : !profile ? (
          <div className="text-center py-8 text-notion-subtle text-sm">Profile not found.</div>
        ) : (
          <div>
            <div className="label-mono mb-2">{fmtLong(selectedDate)}</div>
            <div className="divide-y divide-notion-border border border-notion-border rounded-md overflow-hidden bg-notion-bg">
              {myMeals.length === 0 ? (
                <div className="px-4 py-6 text-center text-notion-subtle text-sm">No meals in your plan.</div>
              ) : myMeals.map(meal => {
                const booked   = !!myBookings[meal]
                const isSaving = saving === meal
                const canToggle = open && !isSaving

                return (
                  <button
                    key={meal}
                    onClick={() => toggleBooking(meal)}
                    disabled={!canToggle}
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
                            booked ? 'bg-notion-bg border-notion-bg' : 'border-notion-border'
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
                Bookings for this day are closed.
              </p>
            )}
          </div>
        )
      )}
    </div>
  )
}
