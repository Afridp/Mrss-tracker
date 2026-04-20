const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  breakfast: { type: Number, default: 0 },
  lunch:     { type: Number, default: 0 },
  dinner:    { type: Number, default: 0 }
});

const mealLogSchema = new mongoose.Schema({
  personId: { type: mongoose.Schema.Types.ObjectId, required: true },
  date:     { type: String, required: true },
  meal:     { type: String, required: true },
  status:   { type: String, default: 'pending' }
});

mealLogSchema.index({ personId: 1, date: 1, meal: 1 }, { unique: true });

const Person  = mongoose.model('Person',  personSchema);
const MealLog = mongoose.model('MealLog', mealLogSchema);

async function connect() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('  Connected to MongoDB');
}

// Return plain object with `id` string instead of `_id`
function fmt(doc) {
  const o = doc.toObject ? doc.toObject() : { ...doc };
  o.id = o._id.toString();
  delete o._id;
  delete o.__v;
  return o;
}

module.exports = { connect, Person, MealLog, fmt };
