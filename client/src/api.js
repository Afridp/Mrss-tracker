import { db } from './firebase'
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, writeBatch
} from 'firebase/firestore'

const peopleCol = collection(db, 'people')
const mealsCol  = collection(db, 'mealLogs')

const MEAL_PRICES = { breakfast: 30, lunch: 60, dinner: 30 }

// ── People ──────────────────────────────────────────────────────────

export async function getPeople() {
  const snap = await getDocs(peopleCol)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function addPerson({ name, breakfast, lunch, dinner }) {
  const data = {
    name: name.trim(),
    breakfast: breakfast ? 1 : 0,
    lunch:     lunch     ? 1 : 0,
    dinner:    dinner    ? 1 : 0
  }
  const ref = await addDoc(peopleCol, data)
  return { id: ref.id, ...data }
}

export async function updatePerson(id, { name, breakfast, lunch, dinner, email }) {
  const data = {
    name: name.trim(),
    breakfast: breakfast ? 1 : 0,
    lunch:     lunch     ? 1 : 0,
    dinner:    dinner    ? 1 : 0
  }
  if (email !== undefined) data.email = email
  await updateDoc(doc(db, 'people', id), data)
}

export async function deletePerson(id) {
  const logsSnap = await getDocs(query(mealsCol, where('personId', '==', id)))
  const batch = writeBatch(db)
  logsSnap.forEach(d => batch.delete(d.ref))
  batch.delete(doc(db, 'people', id))
  await batch.commit()
}

// ── Meals ───────────────────────────────────────────────────────────

export async function getMeals(date) {
  const [peopleSnap, logsSnap] = await Promise.all([
    getDocs(peopleCol),
    getDocs(query(mealsCol, where('date', '==', date)))
  ])
  const people = peopleSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const logs = logsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

  return people.map(person => {
    const meals = {}
    ;['breakfast', 'lunch', 'dinner'].forEach(meal => {
      if (person[meal]) {
        const log = logs.find(l => l.personId === person.id && l.meal === meal)
        meals[meal] = log ? log.status : 'pending'
      }
    })
    return { ...person, meals }
  })
}

async function upsertMealLog(personId, date, meal, status) {
  const existing = await getDocs(query(
    mealsCol,
    where('personId', '==', personId),
    where('date', '==', date),
    where('meal', '==', meal)
  ))
  if (!existing.empty) {
    await updateDoc(existing.docs[0].ref, { status })
  } else {
    await addDoc(mealsCol, { personId, date, meal, status })
  }
}

export async function updateMeal({ personId, date, meal, status }) {
  await upsertMealLog(personId, date, meal, status)
}

export async function bulkUpdateMeals({ personId, date, status }) {
  const personSnap = await getDoc(doc(db, 'people', personId))
  if (!personSnap.exists()) return
  const person = personSnap.data()
  const meals = ['breakfast', 'lunch', 'dinner'].filter(m => person[m])
  await Promise.all(meals.map(m => upsertMealLog(personId, date, m, status)))
}

// ── Billing ─────────────────────────────────────────────────────────

export async function getBilling(month) {
  const [peopleSnap, logsSnap] = await Promise.all([
    getDocs(peopleCol),
    getDocs(query(mealsCol, where('status', '==', 'delivered')))
  ])
  const people = peopleSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const logs = logsSnap.docs
    .map(d => d.data())
    .filter(l => l.date.startsWith(month))

  return people.map(person => {
    const personLogs = logs.filter(l => l.personId === person.id)
    const counts = { breakfast: 0, lunch: 0, dinner: 0 }
    let total = 0
    personLogs.forEach(l => {
      counts[l.meal] = (counts[l.meal] || 0) + 1
      total += MEAL_PRICES[l.meal] || 0
    })
    return { ...person, counts, total }
  })
}
