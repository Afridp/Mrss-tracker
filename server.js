require('dotenv').config();
const express = require('express');
const path = require('path');
const { connect, Person, MealLog, fmt } = require('./database');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/dist')));

const MEAL_PRICES = { breakfast: 30, lunch: 60, dinner: 30 };

// ── People ────────────────────────────────────────────────────────────────────

app.get('/api/people', async (req, res) => {
  const people = await Person.find().sort({ name: 1 });
  res.json(people.map(fmt));
});

app.post('/api/people', async (req, res) => {
  const { name, breakfast, lunch, dinner } = req.body;
  if (!name || (!breakfast && !lunch && !dinner))
    return res.status(400).json({ error: 'Name and at least one meal required' });
  const person = await Person.create({
    name: name.trim(),
    breakfast: breakfast ? 1 : 0,
    lunch:     lunch     ? 1 : 0,
    dinner:    dinner    ? 1 : 0
  });
  res.json(fmt(person));
});

app.put('/api/people/:id', async (req, res) => {
  const { name, breakfast, lunch, dinner } = req.body;
  await Person.findByIdAndUpdate(req.params.id, {
    name: name.trim(),
    breakfast: breakfast ? 1 : 0,
    lunch:     lunch     ? 1 : 0,
    dinner:    dinner    ? 1 : 0
  });
  res.json({ success: true });
});

app.delete('/api/people/:id', async (req, res) => {
  await MealLog.deleteMany({ personId: req.params.id });
  await Person.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ── Meal Logs ─────────────────────────────────────────────────────────────────

app.get('/api/meals/:date', async (req, res) => {
  const { date } = req.params;
  const [people, logs] = await Promise.all([
    Person.find().sort({ name: 1 }),
    MealLog.find({ date })
  ]);

  const result = people.map(person => {
    const meals = {};
    ['breakfast', 'lunch', 'dinner'].forEach(meal => {
      if (person[meal]) {
        const log = logs.find(l => l.personId.equals(person._id) && l.meal === meal);
        meals[meal] = log ? log.status : 'pending';
      }
    });
    return { ...fmt(person), meals };
  });

  res.json(result);
});

app.put('/api/meals', async (req, res) => {
  const { personId, date, meal, status } = req.body;
  await MealLog.findOneAndUpdate(
    { personId, date, meal },
    { $set: { status } },
    { upsert: true }
  );
  res.json({ success: true });
});

app.put('/api/meals/bulk', async (req, res) => {
  const { personId, date, status } = req.body;
  const person = await Person.findById(personId);
  if (!person) return res.status(404).json({ error: 'Person not found' });

  const meals = ['breakfast', 'lunch', 'dinner'].filter(m => person[m]);
  await Promise.all(meals.map(meal =>
    MealLog.findOneAndUpdate(
      { personId, date, meal },
      { $set: { status } },
      { upsert: true }
    )
  ));
  res.json({ success: true });
});

// ── Billing ───────────────────────────────────────────────────────────────────

app.get('/api/billing', async (req, res) => {
  const { month } = req.query;
  const [people, logs] = await Promise.all([
    Person.find().sort({ name: 1 }),
    MealLog.find({ date: { $regex: `^${month}` }, status: 'delivered' })
  ]);

  const billing = people.map(person => {
    const personLogs = logs.filter(l => l.personId.equals(person._id));
    const counts = { breakfast: 0, lunch: 0, dinner: 0 };
    let total = 0;
    personLogs.forEach(l => {
      counts[l.meal] = (counts[l.meal] || 0) + 1;
      total += MEAL_PRICES[l.meal] || 0;
    });
    return { ...fmt(person), counts, total };
  });

  res.json(billing);
});

// ── Fallback ──────────────────────────────────────────────────────────────────

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────

connect().then(() => {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`  Food Tracker running at http://localhost:${PORT}\n`);
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err.message);
  process.exit(1);
});
