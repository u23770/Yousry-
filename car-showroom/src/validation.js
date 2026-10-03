const allowedStatuses = new Set(['available', 'reserved', 'sold']);

export function validateCarInput(input = {}) {
  const errors = {};
  if (!String(input.brand ?? '').trim()) errors.brand = 'Brand is required';
  if (!String(input.model ?? '').trim()) errors.model = 'Model is required';

  const year = Number(input.year);
  if (!Number.isInteger(year) || year < 1950 || year > 2100) errors.year = 'Year must be between 1950 and 2100';

  const price = Number(input.price);
  if (!Number.isFinite(price) || price < 0) errors.price = 'Price must be a non-negative number';

  const mileage = Number(input.mileage ?? 0);
  if (!Number.isFinite(mileage) || mileage < 0) errors.mileage = 'Mileage must be a non-negative number';

  if (input.status && !allowedStatuses.has(input.status)) errors.status = 'Invalid status';

  return { valid: Object.keys(errors).length === 0, errors };
}

export function normalizeCarInput(input = {}) {
  const result = {
    brand: String(input.brand ?? '').trim(),
    model: String(input.model ?? '').trim(),
    year: Number(input.year),
    price: Number(input.price),
    mileage: Number(input.mileage ?? 0),
    status: input.status || 'available'
  };
  const validation = validateCarInput(result);
  if (!validation.valid) {
    const error = new Error('Invalid car data');
    error.fields = validation.errors;
    throw error;
  }
  return result;
}
