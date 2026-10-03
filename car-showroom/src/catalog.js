export function filterCars(cars, filters = {}) {
  const search = String(filters.search ?? '').trim().toLowerCase();
  const minPrice = Number(filters.minPrice ?? 0);
  const maxPrice = Number(filters.maxPrice ?? Number.POSITIVE_INFINITY);

  return cars.filter((car) => {
    const haystack = [car.brand, car.model, car.year, car.bodyType].join(' ').toLowerCase();
    const matchesSearch = !search || haystack.includes(search);
    const matchesPrice = car.price >= minPrice && car.price <= maxPrice;
    const matchesBody = !filters.bodyType || car.bodyType === filters.bodyType;
    const matchesStatus = !filters.status || car.status === filters.status;
    return matchesSearch && matchesPrice && matchesBody && matchesStatus;
  });
}

export function formatEGP(value) {
  return new Intl.NumberFormat('en-US').format(value) + ' EGP';
}

export function getCarStatusLabel(status) {
  return ({ available: 'Available', reserved: 'Reserved', sold: 'Sold' })[status] ?? status;
}
