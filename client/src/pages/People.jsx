import React, { useState, useEffect } from 'react'
import { getPeople, addPerson, updatePerson, deletePerson } from '../api'

const PLAN_LABELS = { breakfast: 'B', lunch: 'L', dinner: 'D' }
const PLAN_COLORS = {
  breakfast: 'bg-yellow-100 text-yellow-700',
  lunch:     'bg-blue-100 text-blue-700',
  dinner:    'bg-purple-100 text-purple-700'
}

function PlanBadges({ person }) {
  return (
    <div className="flex gap-1">
      {['breakfast', 'lunch', 'dinner'].map(m =>
        person[m] ? (
          <span key={m} className={`text-xs font-bold px-2 py-0.5 rounded-full ${PLAN_COLORS[m]}`}>
            {PLAN_LABELS[m]}
          </span>
        ) : null
      )}
    </div>
  )
}

function PlanDesc(person) {
  const meals = ['breakfast', 'lunch', 'dinner'].filter(m => person[m])
  if (meals.length === 3) return 'Full day (₹120/day)'
  if (meals.length === 1 && meals[0] === 'lunch') return 'Lunch only (₹60/day)'
  const prices = { breakfast: 30, lunch: 60, dinner: 30 }
  const total = meals.reduce((s, m) => s + prices[m], 0)
  return `${meals.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' + ')} (₹${total}/day)`
}

function PersonForm({ initial, onSave, onCancel, saving }) {
  const [name, setName] = useState(initial?.name || '')
  const [meals, setMeals] = useState({
    breakfast: initial?.breakfast ? true : false,
    lunch:     initial?.lunch     ? true : false,
    dinner:    initial?.dinner    ? true : false
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Roommate's name"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Meal Plan</label>
        <div className="flex gap-3">
          {[
            { key: 'breakfast', label: '☀️ Breakfast', price: '₹30' },
            { key: 'lunch',     label: '🌤️ Lunch',     price: '₹60' },
            { key: 'dinner',    label: '🌙 Dinner',     price: '₹30' }
          ].map(({ key, label, price }) => (
            <label key={key} className="flex-1 cursor-pointer">
              <input
                type="checkbox"
                checked={meals[key]}
                onChange={() => toggle(key)}
                className="sr-only"
              />
              <div className={`border-2 rounded-lg p-2 text-center transition-colors ${
                meals[key]
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}>
                <div className="text-base">{label.split(' ')[0]}</div>
                <div className="text-xs font-medium text-gray-700">{label.split(' ')[1]}</div>
                <div className="text-xs text-gray-400">{price}</div>
              </div>
            </label>
          ))}
        </div>
        {!meals.breakfast && !meals.lunch && !meals.dinner && (
          <p className="text-xs text-red-500 mt-1">Select at least one meal</p>
        )}
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving || !name.trim() || (!meals.breakfast && !meals.lunch && !meals.dinner)}
          className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default function People() {
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

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-800">Roommates ({people.length})</h2>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
          >
            + Add Person
          </button>
        )}
      </div>

      {showAdd && (
        <div className="bg-white border border-orange-200 rounded-xl p-4 mb-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">New Roommate</h3>
          <PersonForm onSave={handleAdd} onCancel={() => setShowAdd(false)} saving={saving} />
        </div>
      )}

      {people.length === 0 && !showAdd ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">👤</div>
          <div className="text-gray-500">No roommates added yet.</div>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
          >
            Add First Person
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {people.map(person => (
            <div key={person.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {editId === person.id ? (
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Edit {person.name}</h3>
                  <PersonForm
                    initial={person}
                    onSave={(data) => handleEdit(person.id, data)}
                    onCancel={() => setEditId(null)}
                    saving={saving}
                  />
                </div>
              ) : deleteConfirm === person.id ? (
                <div className="p-4 bg-red-50">
                  <p className="text-sm text-red-700 mb-3">
                    Delete <strong>{person.name}</strong>? This will remove all their meal history.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(person.id)}
                      className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{person.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{PlanDesc(person)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <PlanBadges person={person} />
                    <button
                      onClick={() => setEditId(person.id)}
                      className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(person.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
