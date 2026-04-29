import React, { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { useProfile } from '../ProfileContext'
import { useTheme } from '../ThemeContext'
import { getPeople, addPerson, updatePerson } from '../api'

const MEALS = [
  { key: 'breakfast', icon: '☀', label: 'Breakfast', price: '₹30' },
  { key: 'lunch',     icon: '◐', label: 'Lunch',     price: '₹60' },
  { key: 'dinner',    icon: '☾', label: 'Dinner',    price: '₹30' }
]

export default function SetupProfile() {
  const { user, logout } = useAuth()
  const { refetch } = useProfile()
  const { theme, toggle } = useTheme()

  const [unclaimedPeople, setUnclaimedPeople] = useState([])
  const [loading, setLoading]   = useState(true)
  const [mode, setMode]         = useState(null) // null | 'claim' | 'new'
  const [claimId, setClaimId]   = useState(null)
  const [name, setName]         = useState(user?.displayName?.split(' ')[0] || '')
  const [meals, setMeals]       = useState({ breakfast: true, lunch: true, dinner: true })
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    getPeople().then(people => {
      // Show people who don't have an email yet (unclaimed)
      setUnclaimedPeople(people.filter(p => !p.email))
      setLoading(false)
    })
  }, [])

  async function handleClaim(e) {
    e.preventDefault()
    if (!claimId) return
    setSaving(true)
    await updatePerson(claimId, {
      ...unclaimedPeople.find(p => p.id === claimId),
      email: user.email.toLowerCase()
    })
    refetch()
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim() || (!meals.breakfast && !meals.lunch && !meals.dinner)) return
    setSaving(true)
    await addPerson({ name: name.trim(), email: user.email.toLowerCase(), ...meals })
    refetch()
  }

  const ThemeBtn = () => (
    <button onClick={toggle} className="absolute top-4 right-4 w-8 h-8 rounded-md hover:bg-notion-hover text-notion-subtle flex items-center justify-center">
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  )

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-notion-light text-sm">Loading...</div>
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <ThemeBtn />
      <div className="w-full max-w-sm">
        <div className="w-12 h-12 rounded-md bg-notion-text text-notion-bg flex items-center justify-center chip mb-5">M</div>
        <h1 className="text-2xl font-bold text-notion-text tracking-tight mb-1">Welcome</h1>
        <p className="text-sm text-notion-subtle mb-6">
          Signed in as <span className="font-medium text-notion-text">{user?.email}</span>
        </p>

        {/* Step 1 — pick mode */}
        {!mode && (
          <div className="space-y-3">
            {unclaimedPeople.length > 0 && (
              <div>
                <div className="label-mono mb-2">Are you already in the system?</div>
                <div className="divide-y divide-notion-border border border-notion-border rounded-md overflow-hidden">
                  {unclaimedPeople.map(person => (
                    <button
                      key={person.id}
                      onClick={() => { setClaimId(person.id); setMode('claim') }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-notion-hover text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-notion-hover text-notion-text border border-notion-border flex items-center justify-center chip shrink-0">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-notion-text truncate">{person.name}</div>
                        <div className="text-xs text-notion-subtle">
                          {['breakfast','lunch','dinner'].filter(m => person[m]).map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' · ')}
                        </div>
                      </div>
                      <span className="text-notion-light text-sm">→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setMode('new')}
              className="w-full py-2.5 border border-notion-border rounded-md text-sm font-medium text-notion-text hover:bg-notion-hover"
            >
              {unclaimedPeople.length > 0 ? "I'm not in the list — create new profile" : "Create my profile"}
            </button>

            <button onClick={logout} className="w-full text-xs text-notion-light hover:text-notion-subtle text-center pt-1">
              Sign out
            </button>
          </div>
        )}

        {/* Step 2a — claim existing */}
        {mode === 'claim' && (
          <form onSubmit={handleClaim} className="space-y-4">
            <div className="bg-notion-bgSoft border border-notion-border rounded-md px-4 py-3">
              <div className="label-mono mb-1">Claiming profile</div>
              <div className="font-semibold text-notion-text">
                {unclaimedPeople.find(p => p.id === claimId)?.name}
              </div>
              <div className="text-xs text-notion-subtle mt-0.5">
                Your email <span className="font-medium text-notion-text">{user?.email}</span> will be linked. All existing meal history is kept.
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 bg-notion-text text-notion-bg rounded-md text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Linking...' : "Yes, that's me"}
              </button>
              <button
                type="button"
                onClick={() => { setMode(null); setClaimId(null) }}
                className="flex-1 py-2.5 border border-notion-border rounded-md text-sm font-medium text-notion-text hover:bg-notion-hover"
              >
                Back
              </button>
            </div>
          </form>
        )}

        {/* Step 2b — create new */}
        {mode === 'new' && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label-mono block mb-1">Your name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="What should we call you?"
                required
                autoFocus
                className="w-full border border-notion-border rounded-md px-3 py-2.5 text-sm bg-notion-bg text-notion-text focus:border-notion-text focus:ring-1 focus:ring-notion-text"
              />
            </div>
            <div>
              <label className="label-mono block mb-2">Meal plan</label>
              <div className="flex gap-1.5">
                {MEALS.map(({ key, icon, label, price }) => (
                  <label key={key} className="flex-1 cursor-pointer">
                    <input type="checkbox" checked={meals[key]} onChange={() => setMeals(m => ({ ...m, [key]: !m[key] }))} className="sr-only" />
                    <div className={`border rounded-md p-2 text-center ${meals[key] ? 'border-notion-text bg-notion-hover' : 'border-notion-border bg-notion-bg hover:bg-notion-bgSoft'}`}>
                      <div className="text-base text-notion-subtle">{icon}</div>
                      <div className="text-xs font-medium text-notion-text">{label}</div>
                      <div className="stat-value text-[10px] text-notion-subtle">{price}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving || !name.trim() || (!meals.breakfast && !meals.lunch && !meals.dinner)}
                className="flex-1 py-2.5 bg-notion-text text-notion-bg rounded-md text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Enter Mess Tracker'}
              </button>
              <button
                type="button"
                onClick={() => setMode(null)}
                className="flex-1 py-2.5 border border-notion-border rounded-md text-sm font-medium text-notion-text hover:bg-notion-hover"
              >
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
