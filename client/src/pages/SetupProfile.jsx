import React, { useState } from 'react'
import { useAuth } from '../AuthContext'
import { useProfile } from '../ProfileContext'
import { useTheme } from '../ThemeContext'
import { addPerson } from '../api'

const MEALS = [
  { key: 'breakfast', icon: '☀', label: 'Breakfast', price: '₹30' },
  { key: 'lunch',     icon: '◐', label: 'Lunch',     price: '₹60' },
  { key: 'dinner',    icon: '☾', label: 'Dinner',    price: '₹30' }
]

export default function SetupProfile() {
  const { user, logout } = useAuth()
  const { refetch } = useProfile()
  const { theme, toggle } = useTheme()

  const [name, setName]   = useState(user?.displayName?.split(' ')[0] || '')
  const [meals, setMeals] = useState({ breakfast: true, lunch: true, dinner: true })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || (!meals.breakfast && !meals.lunch && !meals.dinner)) return
    setSaving(true)
    await addPerson({ name: name.trim(), email: user.email.toLowerCase(), ...meals })
    refetch()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <button
        onClick={toggle}
        className="absolute top-4 right-4 w-8 h-8 rounded-md hover:bg-notion-hover text-notion-subtle flex items-center justify-center"
      >
        {theme === 'dark' ? '☀' : '☾'}
      </button>

      <div className="w-full max-w-sm">
        <div className="w-12 h-12 rounded-md bg-notion-text text-notion-bg flex items-center justify-center chip mb-5">
          M
        </div>
        <h1 className="text-2xl font-bold text-notion-text tracking-tight mb-1">Set up your profile</h1>
        <p className="text-sm text-notion-subtle mb-6">
          Signed in as <span className="font-medium text-notion-text">{user?.email}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="label-mono block mb-2">Your meal plan</label>
            <div className="flex gap-1.5">
              {MEALS.map(({ key, icon, label, price }) => (
                <label key={key} className="flex-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={meals[key]}
                    onChange={() => setMeals(m => ({ ...m, [key]: !m[key] }))}
                    className="sr-only"
                  />
                  <div className={`border rounded-md p-2 text-center ${
                    meals[key]
                      ? 'border-notion-text bg-notion-hover'
                      : 'border-notion-border bg-notion-bg hover:bg-notion-bgSoft'
                  }`}>
                    <div className="text-base text-notion-subtle">{icon}</div>
                    <div className="text-xs font-medium text-notion-text">{label}</div>
                    <div className="stat-value text-[10px] text-notion-subtle">{price}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !name.trim() || (!meals.breakfast && !meals.lunch && !meals.dinner)}
            className="w-full py-2.5 bg-notion-text text-notion-bg rounded-md text-sm font-semibold hover:opacity-90 disabled:opacity-50 active:scale-95 transition-transform"
          >
            {saving ? 'Setting up...' : 'Enter Mess Tracker'}
          </button>
        </form>

        <button
          onClick={logout}
          className="mt-6 w-full text-xs text-notion-light hover:text-notion-subtle text-center"
        >
          Sign out and use a different account
        </button>
      </div>
    </div>
  )
}
