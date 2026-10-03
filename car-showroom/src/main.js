import { cars } from './data.js';
import { filterCars, formatEGP, getCarStatusLabel } from './catalog.js';

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

function statusClass(status) { return status === 'available' ? 'status-available' : status === 'reserved' ? 'status-reserved' : 'status-sold'; }

function renderCars() {
  const filters = { search: searchInput.value, bodyType: bodyFilter.value, status: statusFilter.value, maxPrice: Number(priceFilter.value) };
  let result = filterCars(cars, filters);
  if (sortSelect.value === 'newest') result.sort((a,b) => b.year-a.year);
  if (sortSelect.value === 'low') result.sort((a,b) => a.price-b.price);
  if (sortSelect.value === 'high') result.sort((a,b) => b.price-a.price);
  resultsCount.textContent = result.length + (result.length === 1 ? ' vehicle' : ' vehicles');
  grid.innerHTML = result.map(car => `
    <article class="car-card" data-id="${car.id}">
      <button class="card-image" aria-label="View ${car.brand} ${car.model}" style="background-image:url('${car.image}')">
        <span class="status-pill ${statusClass(car.status)}">${getCarStatusLabel(car.status)}</span>
        <span class="view-pill">View details ↗</span>
      </button>
      <div class="card-body">
        <div class="card-top"><span>${car.year}</span><span>${car.mileage.toLocaleString()} km</span></div>
        <h3>${car.brand} <strong>${car.model}</strong></h3>
        <div class="spec-row"><span>${car.bodyType}</span><span>${car.transmission}</span><span>${car.fuel}</span></div>
        <div class="card-bottom"><strong>${formatEGP(car.price)}</strong><button class="text-button" data-details="${car.id}">Details →</button></div>
      </div>
    </article>`).join('');
  emptyState.hidden = result.length !== 0;
  grid.hidden = result.length === 0;
}

function openCar(id) {
  const car = cars.find(item => item.id === id);
  if (!car) return;
  dialogContent.innerHTML = `
    <div class="dialog-grid">
      <div class="dialog-image" style="background-image:url('${car.image}')"></div>
      <div class="dialog-copy">
        <p class="eyebrow">${car.year} · ${getCarStatusLabel(car.status)}</p>
        <h2>${car.brand} <em>${car.model}</em></h2>
        <p class="dialog-price">${formatEGP(car.price)}</p>
        <p>${car.description}</p>
        <div class="detail-specs">
          <div><small>Mileage</small><b>${car.mileage.toLocaleString()} km</b></div>
          <div><small>Engine</small><b>${car.engine}</b></div>
          <div><small>Transmission</small><b>${car.transmission}</b></div>
          <div><small>Fuel</small><b>${car.fuel}</b></div>
          <div><small>Color</small><b>${car.color}</b></div>
          <div><small>Body</small><b>${car.bodyType}</b></div>
        </div>
        <div class="dialog-actions"><a class="button button-primary" href="https://wa.me/201000000000?text=Hello%20Northline%2C%20I%27m%20interested%20in%20the%20${encodeURIComponent(car.brand+' '+car.model+' '+car.year)}." target="_blank" rel="noreferrer">WhatsApp specialist ↗</a><button class="button button-ghost" data-request="${car.id}">Request a viewing</button></div>
      </div>
    </div>`;
  dialog.showModal();
}

[searchInput, bodyFilter, statusFilter, priceFilter, sortSelect].forEach(el => el.addEventListener('input', renderCars));
$('#clearFilters').addEventListener('click', () => { searchInput.value=''; bodyFilter.value=''; statusFilter.value=''; priceFilter.value='5000000'; sortSelect.value='featured'; renderCars(); });
$('#resetEmpty').addEventListener('click', () => $('#clearFilters').click());
priceFilter.addEventListener('input', () => priceValue.textContent = 'Up to ' + formatEGP(Number(priceFilter.value)));
grid.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-id], [data-details]');
  if (trigger) openCar(trigger.dataset.id || trigger.dataset.details);
});
dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
  const request = event.target.closest('[data-request]');
  if (request) { $('#leadCar').value = cars.find(c => c.id === request.dataset.request)?.brand + ' ' + cars.find(c => c.id === request.dataset.request)?.model; dialog.close(); $('#contact').scrollIntoView({behavior:'smooth'}); $('#formNote').textContent=''; }
});
$('#dialogClose').addEventListener('click', () => dialog.close());

const menuButton = $('#menuButton');
const mobileMenu = $('#mobileMenu');
menuButton.addEventListener('click', () => { const open = !mobileMenu.hidden; mobileMenu.hidden = open; menuButton.setAttribute('aria-expanded', String(!open)); });
mobileMenu.addEventListener('click', () => { mobileMenu.hidden = true; menuButton.setAttribute('aria-expanded','false'); });

$('#leadForm').addEventListener('submit', event => {
  event.preventDefault();
  $('#formNote').textContent = 'Thanks — this demo captured the lead locally. A production build will store it in the dealership CRM/database.';
  event.target.reset();
});

renderCars();