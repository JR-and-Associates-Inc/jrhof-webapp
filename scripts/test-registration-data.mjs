// Unit tests for src/data/registrations.ts (Node 22.18+ strips the types).
import assert from 'node:assert/strict';
import { findRegistration, formatUsd } from '../src/data/registrations.ts';

// The live banquet meals keep the exact Zeffy answer names (reports and kitchen counts use them).
const banquet = findRegistration('banquet-2027');
assert.ok(banquet);
assert.deepEqual(banquet.meals.map((meal) => meal.name), ['Pasta Carbonara', 'Chicken Piccata']);
// Every meal carries the venue's description (Zeffy campaign and ticket descriptions use the same words).
for (const meal of banquet.meals) {
  assert.ok(meal.description && meal.description.trim().length > 20, `${meal.name}: description is missing`);
  assert.ok(!meal.description.includes(meal.name), `${meal.name}: the description should not repeat the meal name`);
}

assert.equal(formatUsd(4300), '$43');
assert.equal(formatUsd(5050), '$50.50');

console.log('Registration data tests passed.');
