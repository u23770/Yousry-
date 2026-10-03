import { cars as demoCars } from './data.js';
import { filterCars, formatEGP, getCarStatusLabel } from './catalog.js';
import { createLead, listCars } from './lib/data-store.js';
import { escapeHtml } from './sanitize.js';

const $ = (selector) => document.querySelector(selector);
const grid = $('#carGrid');
const emptyState = $('#emptyState');
const resultsCount = $('#resultsCount');
const searchInput = $('#searchInput');
const bodyFilter = $('#bodyFilter');
const statusFilter = $('#statusFilter');
const priceFilter = $('#priceFilter');
const priceValue = $('#priceValue');
const sortSelect = $('#sortSelect');
const dialog = $('#carDialog');
const dialogContent = $('#dialogContent');
let cars = [...demoCars];

function statusClass(status) {
  return status === 'available' ? 'status-available' : status === 'reserved' ? 'status-reserved' : 'status-sold';
}

function renderCars() {
  const filters = {
    search: searchInput.value,
    bodyType: bodyFilter.value,
    status: statusFilter.value,
    maxPrice: Number(priceFilter.value)
  };
  let result = filterCars(cars, filters);
  if (sortSelect.value === 'newest') result.sort((a, b) => b.year - a.year);
  if (sortSelect.value === 'low') result.sort((a, b) => a.price - b.price);
  if (sortSelect.value === 'high') result.sort((a, b) => b.price - a.price);

  resultsCount.textContent = result.length + (result.length === 1 ? ' vehicle' : ' vehicles');
  grid.innerHTML = result.map(car => {
    const id = escapeHtml(car.id);
    return `
      <article class="car-card" data-id="${id}">
        <button class="card-image" aria-label="View ${escapeHtml(car.brand)} ${escapeHtml(car.model)}" style="background-image:url('${escapeHtml(car.image || '')}')">
          <span class="status-pill ${statusClass(car.status)}">${escapeHtml(getCarStatusLabel(car.status))}</span>
          <span class="view-pill">View details ↗</span>
        </button>
        <div class="card-body">
          <div class="card-top"><span>${escapeHtml(car.year)}</span><span>${Number(car.mileage || 0).toLocaleString()} km</span></div>
          <h3>${escapeHtml(car.brand)} <strong>${escapeHtml(car.model)}</strong></h3>
          <div class="spec-row"><span>${escapeHtml(car.bodyType || '')}</span><span>${escapeHtml(car.transmission || '')}</span><span>${escapeHtml(car.fuel || '')}</span></div>
          <div class="card-bottom"><strong>${formatEGP(car.price)}</strong><button class="text-button" data-details="${id}">Details →</button></div>
        </div>
      </article>`;
  }).join('');
  emptyState.hidden = result.length !== 0;
  grid.hidden = result.length === 0;
}

function openCar(id) {
  const car = cars.find(item => item.id === id);
  if (!car) return;
  dialogContent.innerHTML = `
    <div class="dialog-grid">
      <div class="dialog-image" style="background-image:url('${escapeHtml(car.image || '')}')"></div>
      <div class="dialog-copy">
        <p class="eyebrow">${escapeHtml(car.year)} · ${escapeHtml(getCarStatusLabel(car.status))}</p>
        <h2>${escapeHtml(car.brand)} <em>${escapeHtml(car.model)}</em></h2>
        <p class="dialog-price">${formatEGP(car.price)}</p>
        <p>${escapeHtml(car.description || 'Contact our showroom team for full vehicle information.')}</p>
        <div class="detail-specs">
          <div><small>Mileage</small><b>${Number(car.mileage || 0).toLocaleString()} km</b></div>
          <div><small>Engine</small><b>${escapeHtml(car.engine || '—')}</b></div>
          <div><small>Transmission</small><b>${escapeHtml(car.transmission || '—')}</b></div>
          <div><small>Fuel</small><b>${escapeHtml(car.fuel || '—')}</b></div>
          <div><small>Color</small><b>${escapeHtml(car.color || '—')}</b></div>
          <div><small>Body</small><b>${escapeHtml(car.bodyType || '—')}</b></div>
        </div>
        <div class="dialog-actions">
          <a class="button button-primary" href="https://wa.me/201000000000?text=Hello%20Northline%2C%20I%27m%20interested%20in%20the%20${encodeURIComponent(car.brand + ' ' + car.model + ' ' + car.year)}." target="_blank" rel="noopener noreferrer">WhatsApp specialist ↗</a>
          <button class="button button-ghost" data-request="${escapeHtml(car.id)}">Request a viewing</button>
        </div>
      </div>
    </div>`;
  dialog.showModal();
}

async function loadCars() {
  try {
    const liveCars = await listCars(demoCars);
    if (liveCars.length) cars = liveCars.map(car => ({
      ...car,
      image: car.image || demoCars.find(d => d.id === car.id)?.image || ''
    }));
  } catch (error) {
    console.warn('Using demo inventory because the live data source is unavailable.', error);
  }
  renderCars();
}

[searchInput, bodyFilter, statusFilter, priceFilter, sortSelect].forEach(el => el.addEventListener('input', renderCars));
$('#clearFilters').addEventListener('click', () => {
  searchInput.value = '';
  bodyFilter.value = '';
  statusFilter.value = '';
  priceFilter.value = '5000000';
  sortSelect.value = 'featured';
  priceValue.textContent = 'Up to ' + formatEGP(5000000);
  renderCars();
});
$('#resetEmpty').addEventListener('click', () => $('#clearFilters').click());
priceFilter.addEventListener('input', () => priceValue.textContent = 'Up to ' + formatEGP(Number(priceFilter.value)));

grid.addEventListener('click', event => {
  const trigger = event.target.closest('[data-id], [data-details]');
  if (trigger) openCar(trigger.dataset.id || trigger.dataset.details);
});

dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
  const request = event.target.closest('[data-request]');
  if (request) {
    const car = cars.find(item => item.id === request.dataset.request);
    if (car) $('#leadCar').value = car.brand + ' ' + car.model;
    dialog.close();
    $('#contact').scrollIntoView({ behavior: 'smooth' });
    $('#formNote').textContent = '';
  }
});

$('#dialogClose').addEventListener('click', () => dialog.close());

const menuButton = $('#menuButton');
const mobileMenu = $('#mobileMenu');
menuButton.addEventListener('click', () => {
  const open = !mobileMenu.hidden;
  mobileMenu.hidden = open;
  menuButton.setAttribute('aria-expanded', String(!open));
});
mobileMenu.addEventListener('click', () => {
  mobileMenu.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
});

$('#leadForm').addEventListener('submit', async event => {
  event.preventDefault();
  const form = new FormData(event.target);
  const submit = event.target.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    await createLead({
      car_id: null,
      name: String(form.get('name') || '').trim(),
      phone: String(form.get('phone') || '').trim(),
      email: String(form.get('email') || '').trim(),
      lead_type: 'viewing',
      message: String(form.get('message') || '').trim()
    });
    $('#formNote').textContent = 'Request received. Our showroom team will contact you shortly.';
    event.target.reset();
  } catch (error) {
    console.error(error);
    $('#formNote').textContent = 'We could not save the request. Please contact the showroom directly.';
  } finally {
    submit.disabled = false;
  }
});

loadCars();
