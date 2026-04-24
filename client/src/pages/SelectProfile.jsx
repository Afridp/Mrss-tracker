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
    return <div className="min-h-screen flex items-center justify-center text-notion-light text-sm">Loading...</div>
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 py-16 max-w-md mx-auto">
      <div className="w-12 h-12 rounded-md bg-notion-text text-notion-bg flex items-center justify-center chip mb-4">
        M
      </div>
      <h1 className="text-3xl font-bold text-notion-text tracking-tight mb-1">Mess Tracker</h1>
      <p className="label-mono mb-10">Who are you?</p>

      <div className="w-full">
        {people.length === 0 && !showAdd ? (
          <div className="text-center py-8 border border-dashed border-notion-border rounded-md bg-notion-bg">
            <div className="text-notion-text font-medium mb-1">Welcome</div>
            <div className="text-notion-subtle text-sm mb-4">No roommates added yet.</div>
            <button
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 bg-notion-text text-notion-bg rounded-md text-sm font-medium hover:opacity-90"
            >
              Add first person
            </button>
          </div>
        ) : (
          <>
            <div className="divide-y divide-notion-border border border-notion-border rounded-md overflow-hidden mb-3 bg-notion-bg">
              {people.map(person => (
                <button
                  key={person.id}
                  onClick={() => setProfileId(person.id)}
                  className="group w-full hover:bg-notion-bgSoft flex items-center gap-3 px-3 py-2.5"
                >
                  <div className="w-8 h-8 rounded-full bg-notion-hover text-notion-text flex items-center justify-center chip border border-notion-border">
                    {person.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-medium text-notion-text truncate">{person.name}</div>
                    <div className="text-xs text-notion-subtle truncate">
                      {['breakfast', 'lunch', 'dinner']
                        .filter(m => person[m])
                        .map(m => m.charAt(0).toUpperCase() + m.slice(1))
                        .join(' · ')}
                    </div>
                  </div>
                  <span className="text-notion-light group-hover:text-notion-text">→</span>
                </button>
              ))}
            </div>

            {!showAdd && (
              <button
                onClick={() => setShowAdd(true)}
                className="w-full text-sm text-notion-subtle hover:text-notion-text hover:bg-notion-hover py-2 rounded-md font-medium"
              >
                + Add new person
              </button>
            )}
          </>
        )}

        {showAdd && (
          <form onSubmit={handleAdd} className="bg-notion-bg border border-notion-border rounded-md p-4 mt-3 space-y-3">
            <h3 className="font-semibold text-notion-text">New profile</h3>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="w-full border border-notion-border rounded-md px-3 py-2 text-sm focus:border-notion-text focus:ring-1 focus:ring-notion-text"
              autoFocus
            />
            <div>
              <div className="label-mono mb-1.5">Meal plan</div>
              <div className="flex gap-1.5">
                {[
                  { k: 'breakfast', l: '☀', name: 'Breakfast', price: '₹30' },
                  { k: 'lunch',     l: '◐', name: 'Lunch',     price: '₹60' },
                  { k: 'dinner',    l: '☾', name: 'Dinner',    price: '₹30' }
                ].map(({ k, l, name: mealName, price }) => (
                  <label key={k} className="flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={meals[k]}
                      onChange={() => setMeals({ ...meals, [k]: !meals[k] })}
                      className="sr-only"
                    />
                    <div className={`border rounded-md p-2 text-center ${
                      meals[k]
                        ? 'border-notion-text bg-notion-hover'
                        : 'border-notion-border bg-notion-bg hover:bg-notion-bgSoft'
                    }`}>
                      <div className="text-base text-notion-subtle">{l}</div>
                      <div className="text-xs font-medium text-notion-text">{mealName}</div>
                      <div className="stat-value text-[10px] text-notion-subtle">{price}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!name.trim() || saving || (!meals.breakfast && !meals.lunch && !meals.dinner)}
                className="flex-1 py-2 bg-notion-text text-notion-bg rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Create & enter'}
              </button>
              <button
                type="button"
                onClick={() => { setShowAdd(false); setName('') }}
                className="flex-1 py-2 bg-notion-bg text-notion-text border border-notion-border rounded-md text-sm font-medium hover:bg-notion-hover"
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
