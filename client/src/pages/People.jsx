import React, { useState, useEffect } from 'react'
import { getPeople, addPerson, updatePerson, deletePerson } from '../api'
import { useProfile } from '../ProfileContext'

const PLAN_LABELS = { breakfast: 'B', lunch: 'L', dinner: 'D' }

function PlanBadges({ person }) {
  return (
    <div className="flex gap-0.5">
      {['breakfast', 'lunch', 'dinner'].map(m =>
        person[m] ? (
          <span key={m} className="chip w-5 h-5 rounded flex items-center justify-center bg-notion-hover text-notion-subtle border border-notion-border">
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

  function toggle(m) { setMeals(prev => ({ ...prev, [m]: !prev[m] })) }

  function submit(e) {
    e.preventDefault()
    if (!name.trim() || (!meals.breakfast && !meals.lunch && !meals.dinner)) return
    onSave({ name: name.trim(), ...meals })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label-mono block mb-1">Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Roommate's name"
          className="w-full border border-notion-border rounded-md px-3 py-2 text-sm focus:border-notion-text focus:ring-1 focus:ring-notion-text"
          required
        />
      </div>
      <div>
        <label className="label-mono block mb-1.5">Meal plan</label>
        <div className="flex gap-1.5">
          {[
            { key: 'breakfast', icon: '☀', label: 'Breakfast', price: '₹30' },
            { key: 'lunch',     icon: '◐', label: 'Lunch',     price: '₹60' },
            { key: 'dinner',    icon: '☾', label: 'Dinner',    price: '₹30' }
          ].map(({ key, icon, label, price }) => (
            <label key={key} className="flex-1 cursor-pointer">
              <input
                type="checkbox"
                checked={meals[key]}
                onChange={() => toggle(key)}
                className="sr-only"
              />
              <div className={`border rounded-md p-2 text-center ${
                meals[key]
                  ? 'border-notion-text bg-notion-hover'
                  : 'border-notion-border bg-white hover:bg-notion-bgSoft'
              }`}>
                <div className="text-base text-notion-subtle">{icon}</div>
                <div className="text-xs font-medium text-notion-text">{label}</div>
                <div className="stat-value text-[10px] text-notion-subtle">{price}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving || !name.trim() || (!meals.breakfast && !meals.lunch && !meals.dinner)}
          className="flex-1 py-2 bg-notion-text text-white rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 bg-white text-notion-text border border-notion-border rounded-md text-sm font-medium hover:bg-notion-hover"
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

  if (loading) return <div className="text-center py-12 text-notion-light text-sm">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-notion-text tracking-tight">Roommates</h1>
          <div className="label-mono mt-1"><span className="stat-value normal-case tracking-normal">{people.length}</span> {people.length === 1 ? 'person' : 'people'}</div>
        </div>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="px-3 py-1.5 bg-notion-text text-white rounded-md text-sm font-medium hover:opacity-90"
          >
            + Add person
          </button>
        )}
      </div>

      {showAdd && (
        <div className="bg-white border border-notion-border rounded-md p-4 mb-4">
          <h3 className="font-semibold text-notion-text mb-3">New roommate</h3>
          <PersonForm onSave={handleAdd} onCancel={() => setShowAdd(false)} saving={saving} />
        </div>
      )}

      {people.length === 0 && !showAdd ? (
        <div className="text-center py-16 border border-dashed border-notion-border rounded-md bg-white">
          <div className="text-3xl mb-2">·</div>
          <div className="text-notion-text font-medium">No roommates yet</div>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-3 px-3 py-1.5 bg-notion-text text-white rounded-md text-sm font-medium hover:opacity-90"
          >
            Add first person
          </button>
        </div>
      ) : (
        <div className="divide-y divide-notion-border border border-notion-border rounded-md overflow-hidden bg-white">
          {people.map(person => {
            const isMe = person.id === profileId
            return (
              <div key={person.id}>
                {editId === person.id ? (
                  <div className="p-4">
                    <h3 className="font-semibold text-notion-text mb-3">Edit {person.name}</h3>
                    <PersonForm
                      initial={person}
                      onSave={(data) => handleEdit(person.id, data)}
                      onCancel={() => setEditId(null)}
                      saving={saving}
                    />
                  </div>
                ) : deleteConfirm === person.id ? (
                  <div className="p-4 bg-notion-hover border-l-2 border-notion-text">
                    <p className="text-sm text-notion-text mb-3">
                      Delete <strong>{person.name}</strong>? This removes all their meal history.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(person.id)}
                        className="flex-1 py-2 bg-notion-text text-white rounded-md text-sm font-medium hover:opacity-90"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="flex-1 py-2 bg-white text-notion-text border border-notion-border rounded-md text-sm font-medium hover:bg-notion-hover"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-3 py-2.5 hover:bg-notion-bgSoft group">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-notion-hover text-notion-text flex items-center justify-center chip shrink-0 border border-notion-border">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-notion-text truncate">{person.name}</span>
                          {isMe && (
                            <span className="chip px-1.5 py-0.5 bg-notion-text text-white rounded shrink-0">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-notion-subtle truncate">{planDesc(person)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <PlanBadges person={person} />
                      <button
                        onClick={() => setEditId(person.id)}
                        className="w-7 h-7 text-notion-light hover:text-notion-text hover:bg-notion-hover rounded flex items-center justify-center opacity-0 group-hover:opacity-100"
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(person.id)}
                        className="w-7 h-7 text-notion-light hover:text-notion-text hover:bg-notion-hover rounded flex items-center justify-center opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        ×
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
