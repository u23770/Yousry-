import { listCars, saveCar, removeCar, signIn, signOut } from './lib/data-store.js';
import { hasSupabaseConfig } from './lib/config.js';
import { supabase } from './lib/supabase.js';
import { cars as demoCars } from './data.js';
import { formatEGP, getCarStatusLabel } from './catalog.js';
import { escapeHtml } from './sanitize.js';

const $ = selector => document.querySelector(selector);
const inventoryTable = $('#inventoryTable');
const vehicleDialog = $('#vehicleDialog');
const vehicleForm = $('#vehicleForm');
const loginDialog = $('#loginDialog');
let cars = [];

function setToday() {
  $('#todayLabel').textContent = new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  }).format(new Date()).toUpperCase();
}

function renderStats() {
  $('#inventoryCount').textContent = cars.filter(c => c.status !== 'sold').length;
  $('#publishedCount').textContent = cars.filter(c => c.is_published !== false).length;
  $('#soldCount').textContent = cars.filter(c => c.status === 'sold').length;
  $('#inventoryMeta').textContent = `${cars.filter(c => c.status === 'reserved').length} reserved`;
}

function renderInventory() {
  if (!cars.length) {
    inventoryTable.innerHTML = '<div class="empty-row">No vehicles yet. Add your first vehicle.</div>';
    return;
  }
  inventoryTable.innerHTML = `
    <div class="tr th"><span>Vehicle</span><span>Price</span><span>Status</span><span>Year</span><span></span></div>
    ${cars.map(car => `
      <div class="tr">
        <span><b>${escapeHtml(car.brand)} ${escapeHtml(car.model)}</b><small>${escapeHtml(car.year)} · ${Number(car.mileage || 0).toLocaleString()} km</small></span>
        <span>${formatEGP(car.price)}</span>
        <span class="${escapeHtml(car.status)}">${escapeHtml(getCarStatusLabel(car.status))}</span>
        <span>${escapeHtml(car.year)}</span>
        <span class="row-actions"><button data-edit="${escapeHtml(car.id)}">Edit</button><button data-delete="${escapeHtml(car.id)}">Delete</button></span>
      </div>`).join('')}`;
}

function renderLeads() {
  const leads = JSON.parse(localStorage.getItem('northline-leads-v1') || '[]');
  $('#leadCount').textContent = leads.length;
  $('#leadBadge').textContent = leads.length;
  $('#leadList').innerHTML = leads.length ? leads.slice(0, 8).map(lead => `
    <article><div class="avatar">${escapeHtml((lead.name || 'L').slice(0, 2).toUpperCase())}</div>
      <div><b>${escapeHtml(lead.name || 'Unknown')}</b><small>${escapeHtml(lead.phone || lead.email || 'No contact')} · ${escapeHtml(lead.message || 'Viewing request')}</small></div>
      <strong>New</strong>
    </article>`).join('') : '<div class="empty-row">No leads yet.</div>';
}

function openCreate() {
  vehicleForm.reset();
  vehicleForm.elements.id.value = '';
  $('#formTitle').textContent = 'Add vehicle';
  $('#formError').textContent = '';
  vehicleDialog.showModal();
}

function openEdit(id) {
  const car = cars.find(item => item.id === id);
  if (!car) return;
  vehicleForm.reset();
  vehicleForm.elements.id.value = car.id;
  for (const key of ['brand','model','year','price','mileage','status','bodyType','fuel','transmission','color','engine','description']) {
    if (vehicleForm.elements[key]) vehicleForm.elements[key].value = car[key] ?? '';
  }
  vehicleForm.elements.featured.checked = Boolean(car.featured);
  $('#formTitle').textContent = 'Edit vehicle';
  $('#formError').textContent = '';
  vehicleDialog.showModal();
}

async function refresh() {
  cars = await listCars(demoCars);
  renderStats();
  renderInventory();
  renderLeads();
}

$('#addVehicle').addEventListener('click', openCreate);
$('#closeVehicle').addEventListener('click', () => vehicleDialog.close());
inventoryTable.addEventListener('click', async event => {
  const edit = event.target.closest('[data-edit]');
  const del = event.target.closest('[data-delete]');
  if (edit) openEdit(edit.dataset.edit);
  if (del && confirm('Delete this vehicle?')) {
    try { await removeCar(del.dataset.delete); await refresh(); }
    catch (error) { alert(error.message || 'Could not delete vehicle.'); }
  }
});

vehicleForm.addEventListener('submit', async event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(vehicleForm));
  data.featured = vehicleForm.elements.featured.checked;
  data.is_published = true;
  try {
    await saveCar(data, data.id || null);
    vehicleDialog.close();
    await refresh();
  } catch (error) {
    $('#formError').textContent = Object.values(error.fields || {}).join(' · ') || error.message || 'Could not save vehicle.';
  }
});

$('#signOut').addEventListener('click', async () => {
  await signOut();
  if (hasSupabaseConfig) location.reload();
});

$('#loginForm').addEventListener('submit', async event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  try {
    await signIn(data.email, data.password);
    loginDialog.close();
    await refresh();
  } catch (error) {
    $('#loginError').textContent = error.message || 'Sign in failed.';
  }
});

async function initAuth() {
  if (!hasSupabaseConfig || !supabase) {
    $('#loginMode').textContent = 'Demo mode is active until Supabase environment variables are configured.';
    return;
  }
  const { data } = await supabase.auth.getSession();
  if (!data.session) loginDialog.showModal();
}

setToday();
await initAuth();
await refresh();
