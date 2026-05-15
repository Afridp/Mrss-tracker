import { db } from './firebase'
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  setDoc, query, where, writeBatch
} from 'firebase/firestore'

const peopleCol    = collection(db, 'people')
const mealsCol     = collection(db, 'mealLogs')
const bookingsCol  = collection(db, 'mealBookings')

export const MEAL_PRICES = { breakfast: 35, lunch: 50, dinner: 35 }

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
  // Deterministic ID prevents duplicate documents entirely
  const id = `${personId}_${date}_${meal}`
  await setDoc(doc(mealsCol, id), { personId, date, meal, status })
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
  const rawLogs = logsSnap.docs.map(d => d.data()).filter(l => l.date.startsWith(month))
  // Deduplicate: keep only one record per (personId, date, meal)
  const seen = new Set()
  const logs = rawLogs.filter(l => {
    const key = `${l.personId}_${l.date}_${l.meal}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

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

// ── Report ───────────────────────────────────────────────────────────

export async function getReport(fromDate, toDate) {
  const [peopleSnap, logsSnap] = await Promise.all([
    getDocs(peopleCol),
    getDocs(query(mealsCol, where('status', '==', 'delivered')))
  ])
  const people = peopleSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const rawLogs2 = logsSnap.docs.map(d => d.data()).filter(l => l.date >= fromDate && l.date <= toDate)
  const seen2 = new Set()
  const logs = rawLogs2.filter(l => {
    const key = `${l.personId}_${l.date}_${l.meal}`
    if (seen2.has(key)) return false
    seen2.add(key)
    return true
  })

  return people.map(person => {
    const personLogs = logs.filter(l => l.personId === person.id)
    const counts = { breakfast: 0, lunch: 0, dinner: 0 }
    let total = 0
    personLogs.forEach(l => {
      counts[l.meal] = (counts[l.meal] || 0) + 1
      total += MEAL_PRICES[l.meal] || 0
    })
    const totalMeals = Object.values(counts).reduce((a, b) => a + b, 0)
    return { ...person, counts, total, totalMeals }
  })
}

// ── Bookings ─────────────────────────────────────────────────────────

export async function getBookings(date) {
  const snap = await getDocs(query(bookingsCol, where('date', '==', date)))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function setBooking(personId, date, meal, booked) {
  const id = `${personId}_${date}_${meal}_booking`
  await setDoc(doc(bookingsCol, id), { personId, date, meal, booked })
}

// Auto-feed bookings → meal logs as 'delivered' for a settled day.
// Only creates logs that don't already exist — manual toggles are preserved.
export async function autoMarkDeliveredFromBookings(date) {
  const [bookingsSnap, logsSnap] = await Promise.all([
    getDocs(query(bookingsCol, where('date', '==', date))),
    getDocs(query(mealsCol, where('date', '==', date)))
  ])

  const bookedItems = bookingsSnap.docs.map(d => d.data()).filter(b => b.booked)
  const existing = new Set()
  logsSnap.docs.forEach(d => {
    const data = d.data()
    existing.add(`${data.personId}_${data.meal}`)
  })

  const toCreate = bookedItems.filter(b => !existing.has(`${b.personId}_${b.meal}`))
  if (toCreate.length === 0) return 0

  const batch = writeBatch(db)
  toCreate.forEach(b => {
    const id = `${b.personId}_${b.date}_${b.meal}`
    batch.set(doc(mealsCol, id), {
      personId: b.personId, date: b.date, meal: b.meal, status: 'delivered'
    })
  })
  await batch.commit()
  return toCreate.length
}

// ── One-time cleanup ─────────────────────────────────────────────────

export async function cleanupDuplicateMealLogs() {
  const snap = await getDocs(mealsCol)
  const all = snap.docs.map(d => ({ docId: d.id, ref: d.ref, ...d.data() }))

  // Group by (personId, date, meal)
  const groups = {}
  all.forEach(entry => {
    const key = `${entry.personId}_${entry.date}_${entry.meal}`
    if (!groups[key]) groups[key] = []
    groups[key].push(entry)
  })

  let fixed = 0
  const batch = writeBatch(db)

  Object.entries(groups).forEach(([key, docs]) => {
    // Prefer 'delivered' status if any doc has it
    const status = docs.some(d => d.status === 'delivered') ? 'delivered' : docs[0].status
    const { personId, date, meal } = docs[0]

    // Write canonical doc with deterministic ID
    batch.set(doc(mealsCol, key), { personId, date, meal, status })

    // Delete all docs whose ID doesn't match the canonical ID
    docs.forEach(d => {
      if (d.docId !== key) {
        batch.delete(d.ref)
        fixed++
      }
    })
  })

  await batch.commit()
  return fixed
}
