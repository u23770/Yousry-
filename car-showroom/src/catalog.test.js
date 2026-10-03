import test from 'node:test';
import assert from 'node:assert/strict';
import { filterCars, formatEGP, getCarStatusLabel } from './catalog.js';

const cars = [
  { id: 1, brand: 'BMW', model: 'X5', year: 2025, price: 4200000, mileage: 12000, bodyType: 'SUV', status: 'available' },
  { id: 2, brand: 'Toyota', model: 'Camry', year: 2024, price: 1900000, mileage: 35000, bodyType: 'Sedan', status: 'sold' },
  { id: 3, brand: 'Mercedes-Benz', model: 'C200', year: 2025, price: 3100000, mileage: 9000, bodyType: 'Sedan', status: 'reserved' }
];

test('filters inventory by search and price range', () => {
  const result = filterCars(cars, { search: 'bmw', minPrice: 4000000, maxPrice: 4500000 });
  assert.deepEqual(result.map(car => car.id), [1]);
});

test('filters by body type and availability', () => {
  const result = filterCars(cars, { bodyType: 'Sedan', status: 'available' });
  assert.deepEqual(result, []);
});

test('formats Egyptian pound values for the UI', () => {
  assert.equal(formatEGP(1900000), '1,900,000 EGP');
});

test('maps inventory status to human-readable labels', () => {
  assert.equal(getCarStatusLabel('available'), 'Available');
  assert.equal(getCarStatusLabel('reserved'), 'Reserved');
  assert.equal(getCarStatusLabel('sold'), 'Sold');
});