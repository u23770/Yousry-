import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCarInput, validateCarInput } from './validation.js';

test('rejects a car with missing required fields', () => {
  const result = validateCarInput({ brand: '', model: '', year: 2026, price: 100000 });
  assert.equal(result.valid, false);
  assert.ok(result.errors.brand);
  assert.ok(result.errors.model);
});

test('normalizes numeric and text fields for a valid car', () => {
  const car = normalizeCarInput({
    brand: ' BMW ',
    model: ' X5 ',
    year: '2025',
    price: '4200000',
    mileage: '12000',
    status: 'available'
  });
  assert.deepEqual(car, {
    brand: 'BMW',
    model: 'X5',
    year: 2025,
    price: 4200000,
    mileage: 12000,
    status: 'available'
  });
});
