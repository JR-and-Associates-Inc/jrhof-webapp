// Unit tests for src/data/registrations.ts (Node 22.18+ strips the types).
import assert from 'node:assert/strict';
import { findRegistration, formatUsd, mealChoicesText } from '../src/data/registrations.ts';

// Meal names alone, then with optional venue descriptions in parentheses.
assert.equal(mealChoicesText([{ id: 'a', name: 'Pasta Carbonara' }, { id: 'b', name: 'Chicken Piccata' }]), 'Pasta Carbonara or Chicken Piccata');
assert.equal(
  mealChoicesText([{ id: 'a', name: 'Pasta Carbonara', description: 'test description' }, { id: 'b', name: 'Chicken Piccata' }]),
  'Pasta Carbonara (test description) or Chicken Piccata',
);

// The live banquet meals keep the exact Zeffy answer names (reports and kitchen counts use them).
const banquet = findRegistration('banquet-2027');
assert.ok(banquet);
assert.deepEqual(banquet.meals.map((meal) => meal.name), ['Pasta Carbonara', 'Chicken Piccata']);
for (const meal of banquet.meals) {
  if (meal.description !== undefined) assert.ok(meal.description.trim().length > 0 && !/[()]/.test(meal.description), `${meal.name}: description must be plain text without parentheses`);
}

assert.equal(formatUsd(4300), '$43');
assert.equal(formatUsd(5050), '$50.50');

console.log('Registration data tests passed.');
