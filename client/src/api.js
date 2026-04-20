const BASE = '/api';

async function json(url, opts = {}) {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const getPeople = () => json('/people');
export const addPerson = (data) => json('/people', { method: 'POST', body: JSON.stringify(data) });
export const updatePerson = (id, data) => json(`/people/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePerson = (id) => json(`/people/${id}`, { method: 'DELETE' });

export const getMeals = (date) => json(`/meals/${date}`);
export const updateMeal = (data) => json('/meals', { method: 'PUT', body: JSON.stringify(data) });
export const bulkUpdateMeals = (data) => json('/meals/bulk', { method: 'PUT', body: JSON.stringify(data) });

export const getBilling = (month) => json(`/billing?month=${month}`);
