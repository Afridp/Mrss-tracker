import React, { useState, useEffect } from 'react'
import { getPeople, addPerson } from '../api'
import { useProfile } from '../ProfileContext'

export default function SelectProfile() {
  const { setProfileId } = useProfile()
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [meals, setMeals] = useState({ breakfast: true, lunch: true, dinner: true })
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const p = await getPeople()
    setPeople(p)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!name.trim() || (!meals.breakfast && !meals.lunch && !meals.dinner)) return
    setSaving(true)
    const person = await addPerson({ name, ...meals })
    setSaving(false)
    setShowAdd(false)
    setName('')
    setProfileId(person.id)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-stone-400 text-sm">Loading...</div>
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 py-12">
      <div className="text-6xl mb-3 animate-pulse">🍱</div>
      <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight mb-1">Who are you?</h1>
      <p className="text-stone-500 mb-8 text-center">Tap your name to get started</p>

      <div className="w-full max-w-md">
        {people.length === 0 && !showAdd ? (
          <div className="text-center py-8 bg-white/60 border border-stone-200/70 rounded-3xl px-6">
            <div className="text-5xl mb-3">👋</div>
            <div className="text-stone-700 font-medium mb-1">Welcome!</div>
            <div className="text-stone-500 text-sm mb-5">No roommates added yet.</div>
            <button
              onClick={() => setShowAdd(true)}
              className="px-5 py-2.5 bg-gradient-to-br from-orange-500 to-rose-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] shadow-md"
            >
              Add First Person
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {people.map(person => (
                <button
                  key={person.id}
                  onClick={() => setProfileId(person.id)}
                  className="group w-full bg-white hover:bg-orange-50 border border-stone-200/70 hover:border-orange-300 rounded-2xl p-3 flex items-center gap-3 shadow-sm hover:shadow-md hover:scale-[1.01]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-400 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {person.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-stone-900">{person.name}</div>
                    <div className="text-xs text-stone-400 font-medium mt-0.5">
                      {['breakfast', 'lunch', 'dinner']
                        .filter(m => person[m])
                        .map(m => m.charAt(0).toUpperCase() + m.slice(1))
                        .join(' · ')}
                    </div>
                  </div>
                  <div className="text-stone-300 group-hover:text-orange-500 text-xl">→</div>
                </button>
              ))}
            </div>

            {!showAdd && (
              <button
                onClick={() => setShowAdd(true)}
                className="w-full text-sm text-stone-500 hover:text-orange-600 py-3 font-medium"
              >
                + Add new person
              </button>
            )}
          </>
        )}

        {showAdd && (
          <form onSubmit={handleAdd} className="bg-white border border-orange-200 rounded-3xl p-5 space-y-4 shadow-md mt-2">
            <h3 className="font-bold text-stone-900">New Profile</h3>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              autoFocus
            />
            <div>
              <div className="text-xs text-stone-500 font-medium uppercase tracking-wide mb-2">Meal plan</div>
              <div className="flex gap-2">
                {[
                  { k: 'breakfast', l: '☀️', name: 'Breakfast', price: '₹30' },
                  { k: 'lunch',     l: '🌤️', name: 'Lunch',     price: '₹60' },
                  { k: 'dinner',    l: '🌙', name: 'Dinner',    price: '₹30' }
                ].map(({ k, l, name: mealName, price }) => (
                  <label key={k} className="flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={meals[k]}
                      onChange={() => setMeals({ ...meals, [k]: !meals[k] })}
                      className="sr-only"
                    />
                    <div className={`border-2 rounded-xl p-2 text-center ${
                      meals[k] ? 'border-orange-400 bg-orange-50' : 'border-stone-200 bg-white'
                    }`}>
                      <div className="text-xl">{l}</div>
                      <div className="text-xs font-semibold text-stone-700">{mealName}</div>
                      <div className="text-[10px] text-stone-400">{price}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!name.trim() || saving || (!meals.breakfast && !meals.lunch && !meals.dinner)}
                className="flex-1 py-2.5 bg-gradient-to-br from-orange-500 to-rose-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg disabled:opacity-50 shadow"
              >
                {saving ? 'Saving...' : 'Create & Enter'}
              </button>
              <button
                type="button"
                onClick={() => { setShowAdd(false); setName('') }}
                className="flex-1 py-2.5 bg-stone-100 text-stone-700 rounded-xl text-sm font-semibold hover:bg-stone-200"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
