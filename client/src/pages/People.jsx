import React, { useState, useEffect } from 'react'
import { getPeople, addPerson, updatePerson, deletePerson } from '../api'
import { useProfile } from '../ProfileContext'

const PLAN_LABELS = { breakfast: 'B', lunch: 'L', dinner: 'D' }
const PLAN_COLORS = {
  breakfast: 'bg-amber-100 text-amber-700',
  lunch:     'bg-sky-100 text-sky-700',
  dinner:    'bg-indigo-100 text-indigo-700'
}

function PlanBadges({ person }) {
  return (
    <div className="flex gap-1">
      {['breakfast', 'lunch', 'dinner'].map(m =>
        person[m] ? (
          <span key={m} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PLAN_COLORS[m]}`}>
            {PLAN_LABELS[m]}
          </span>
        ) : null
      )}
    </div>
  )
}

function planDesc(person) {
  const meals = ['breakfast', 'lunch', 'dinner'].filter(m => person[m])
  if (meals.length === 3) return 'Full day · ₹120/day'
  if (meals.length === 1 && meals[0] === 'lunch') return 'Lunch only · ₹60/day'
  const prices = { breakfast: 30, lunch: 60, dinner: 30 }
  const total = meals.reduce((s, m) => s + prices[m], 0)
  return `${meals.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' + ')} · ₹${total}/day`
}

function PersonForm({ initial, onSave, onCancel, saving }) {
  const [name, setName] = useState(initial?.name || '')
  const [meals, setMeals] = useState({
    breakfast: !!initial?.breakfast,
    lunch:     !!initial?.lunch,
    dinner:    !!initial?.dinner
  })

  function toggle(m) {
    setMeals(prev => ({ ...prev, [m]: !prev[m] }))
  }

  function submit(e) {
    e.preventDefault()
    if (!name.trim() || (!meals.breakfast && !meals.lunch && !meals.dinner)) return
    onSave({ name: name.trim(), ...meals })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Roommate's name"
          className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Meal Plan</label>
        <div className="flex gap-2">
          {[
            { key: 'breakfast', icon: '☀️', label: 'Breakfast', price: '₹30' },
            { key: 'lunch',     icon: '🌤️', label: 'Lunch',     price: '₹60' },
            { key: 'dinner',    icon: '🌙', label: 'Dinner',    price: '₹30' }
          ].map(({ key, icon, label, price }) => (
            <label key={key} className="flex-1 cursor-pointer">
              <input
                type="checkbox"
                checked={meals[key]}
                onChange={() => toggle(key)}
                className="sr-only"
              />
              <div className={`border-2 rounded-xl p-2 text-center ${
                meals[key] ? 'border-orange-400 bg-orange-50' : 'border-stone-200 bg-white'
              }`}>
                <div className="text-xl">{icon}</div>
                <div className="text-xs font-semibold text-stone-700">{label}</div>
                <div className="text-[10px] text-stone-400">{price}</div>
              </div>
            </label>
          ))}
        </div>
        {!meals.breakfast && !meals.lunch && !meals.dinner && (
          <p className="text-xs text-rose-500 mt-1">Select at least one meal</p>
        )}
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving || !name.trim() || (!meals.breakfast && !meals.lunch && !meals.dinner)}
          className="flex-1 py-2.5 bg-gradient-to-br from-orange-500 to-rose-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg disabled:opacity-50 shadow"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 bg-stone-100 text-stone-700 rounded-xl text-sm font-semibold hover:bg-stone-200"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default function People() {
  const { profileId } = useProfile()
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  async function load() {
    const data = await getPeople()
    setPeople(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAdd(data) {
    setSaving(true)
    await addPerson(data)
    await load()
    setShowAdd(false)
    setSaving(false)
  }

  async function handleEdit(id, data) {
    setSaving(true)
    await updatePerson(id, data)
    await load()
    setEditId(null)
    setSaving(false)
  }

  async function handleDelete(id) {
    await deletePerson(id)
    await load()
    setDeleteConfirm(null)
  }

  if (loading) return <div className="text-center py-12 text-stone-400 text-sm">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
          Roommates <span className="text-stone-400 font-medium">({people.length})</span>
        </h2>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="px-3 py-2 bg-gradient-to-br from-orange-500 to-rose-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg shadow"
          >
            + Add Person
          </button>
        )}
      </div>

      {showAdd && (
        <div className="bg-white border border-orange-200 rounded-2xl p-4 mb-4 shadow-sm">
          <h3 className="font-bold text-stone-900 mb-3">New Roommate</h3>
          <PersonForm onSave={handleAdd} onCancel={() => setShowAdd(false)} saving={saving} />
        </div>
      )}

      {people.length === 0 && !showAdd ? (
        <div className="text-center py-12 bg-white/50 rounded-2xl border border-stone-200/50">
          <div className="text-5xl mb-3">👤</div>
          <div className="text-stone-600 font-medium">No roommates added yet.</div>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-3 px-4 py-2 bg-gradient-to-br from-orange-500 to-rose-500 text-white rounded-xl text-sm font-semibold shadow hover:shadow-lg"
          >
            Add First Person
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {people.map(person => {
            const isMe = person.id === profileId
            return (
              <div
                key={person.id}
                className={`rounded-2xl shadow-sm overflow-hidden ${
                  isMe ? 'bg-white border-2 border-orange-200' : 'bg-white border border-stone-200/70'
                }`}
              >
                {editId === person.id ? (
                  <div className="p-4">
                    <h3 className="font-bold text-stone-900 mb-3">Edit {person.name}</h3>
                    <PersonForm
                      initial={person}
                      onSave={(data) => handleEdit(person.id, data)}
                      onCancel={() => setEditId(null)}
                      saving={saving}
                    />
                  </div>
                ) : deleteConfirm === person.id ? (
                  <div className="p-4 bg-rose-50">
                    <p className="text-sm text-rose-700 mb-3">
                      Delete <strong>{person.name}</strong>? This removes all their meal history.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(person.id)}
                        className="flex-1 py-2 bg-rose-500 text-white rounded-xl text-sm font-semibold hover:bg-rose-600"
                      >
                        Yes, Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="flex-1 py-2 bg-white text-stone-700 rounded-xl text-sm font-semibold hover:bg-stone-50 border border-stone-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-400 to-rose-400 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 truncate">{person.name}</span>
                          {isMe && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-orange-500 text-white rounded-full shrink-0">YOU</span>}
                        </div>
                        <div className="text-xs text-stone-400 font-medium mt-0.5 truncate">{planDesc(person)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <PlanBadges person={person} />
                      <button
                        onClick={() => setEditId(person.id)}
                        className="w-8 h-8 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg flex items-center justify-center"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(person.id)}
                        className="w-8 h-8 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg flex items-center justify-center"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
