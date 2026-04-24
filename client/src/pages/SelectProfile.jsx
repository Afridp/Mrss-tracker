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
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start px-4 py-10">
      <div className="text-5xl mb-3">🍱</div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Who are you?</h1>
      <p className="text-gray-500 mb-6 text-center text-sm">Pick your profile to continue</p>

      <div className="w-full max-w-md">
        {people.length === 0 && !showAdd ? (
          <div className="text-center py-6">
            <div className="text-gray-500 mb-4">No roommates added yet.</div>
            <button
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600"
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
                  className="w-full bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-300 rounded-xl p-3 flex items-center gap-3 transition"
                >
                  <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg">
                    {person.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-gray-800">{person.name}</div>
                    <div className="text-xs text-gray-400">
                      {['breakfast', 'lunch', 'dinner']
                        .filter(m => person[m])
                        .map(m => m.charAt(0).toUpperCase() + m.slice(1))
                        .join(' · ')}
                    </div>
                  </div>
                  <div className="text-gray-400 text-lg">→</div>
                </button>
              ))}
            </div>

            {!showAdd && (
              <button
                onClick={() => setShowAdd(true)}
                className="w-full text-sm text-gray-500 hover:text-orange-600 py-2"
              >
                + Add new person
              </button>
            )}
          </>
        )}

        {showAdd && (
          <form onSubmit={handleAdd} className="bg-white border border-orange-200 rounded-xl p-4 space-y-3 shadow-sm">
            <h3 className="font-semibold text-gray-800">New Profile</h3>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              autoFocus
            />
            <div>
              <div className="text-xs text-gray-500 mb-1">Meal plan</div>
              <div className="flex gap-2">
                {[
                  { k: 'breakfast', l: '☀️ B', price: '₹30' },
                  { k: 'lunch',     l: '🌤️ L', price: '₹60' },
                  { k: 'dinner',    l: '🌙 D', price: '₹30' }
                ].map(({ k, l, price }) => (
                  <label key={k} className="flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={meals[k]}
                      onChange={() => setMeals({ ...meals, [k]: !meals[k] })}
                      className="sr-only"
                    />
                    <div className={`border-2 rounded-lg p-2 text-center transition-colors ${
                      meals[k] ? 'border-orange-400 bg-orange-50' : 'border-gray-200'
                    }`}>
                      <div className="font-medium text-sm">{l}</div>
                      <div className="text-xs text-gray-400">{price}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!name.trim() || saving || (!meals.breakfast && !meals.lunch && !meals.dinner)}
                className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Create & Enter'}
              </button>
              <button
                type="button"
                onClick={() => { setShowAdd(false); setName('') }}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
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
