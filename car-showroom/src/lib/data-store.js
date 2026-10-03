import { DEALERSHIP_ID, hasSupabaseConfig } from './config.js';
import { supabase } from './supabase.js';
import { normalizeCarInput } from '../validation.js';

const LOCAL_KEY = 'northline-cars-v1';

function readLocalCars() {
  try {
    const value = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeLocalCars(cars) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(cars));
}

function toAppCar(row) {
  return {
    ...row,
    mileage: Number(row.mileage || 0),
    price: Number(row.price || 0),
    fuel: row.fuel_type,
    bodyType: row.body_type
  };
}

export async function listCars(fallback = []) {
  if (!hasSupabaseConfig) {
    const local = readLocalCars();
    return local.length ? local : fallback;
  }
  const { data, error } = await supabase
    .from('cars')
    .select('id,brand,model,year,price,mileage,body_type,fuel_type,transmission,color,engine,description,status,is_published,featured,slug')
    .eq('dealership_id', DEALERSHIP_ID)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(toAppCar);
}

export async function saveCar(input, existingId = null) {
  const normalized = normalizeCarInput(input);
  const payload = {
    ...normalized,
    dealership_id: DEALERSHIP_ID || undefined,
    body_type: input.bodyType || input.body_type || null,
    fuel_type: input.fuel || input.fuel_type || null,
    transmission: input.transmission || null,
    color: input.color || null,
    engine: input.engine || null,
    description: input.description || null,
    is_published: input.is_published ?? true,
    featured: input.featured ?? false,
    slug: input.slug || `${normalized.brand}-${normalized.model}-${normalized.year}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  };

  if (!hasSupabaseConfig) {
    const cars = readLocalCars();
    const record = { id: existingId || crypto.randomUUID(), ...payload };
    const next = existingId ? cars.map(car => car.id === existingId ? { ...car, ...record } : car) : [record, ...cars];
    writeLocalCars(next);
    return record;
  }

  const query = existingId
    ? supabase.from('cars').update(payload).eq('id', existingId).eq('dealership_id', DEALERSHIP_ID).select().single()
    : supabase.from('cars').insert(payload).select().single();
  const { data, error } = await query;
  if (error) throw error;
  return toAppCar(data);
}

export async function removeCar(id) {
  if (!hasSupabaseConfig) {
    writeLocalCars(readLocalCars().filter(car => car.id !== id));
    return;
  }
  const { error } = await supabase.from('cars').delete().eq('id', id).eq('dealership_id', DEALERSHIP_ID);
  if (error) throw error;
}

export async function createLead(input) {
  if (!hasSupabaseConfig) {
    const key = 'northline-leads-v1';
    const leads = JSON.parse(localStorage.getItem(key) || '[]');
    leads.unshift({ id: crypto.randomUUID(), ...input, created_at: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(leads));
    return leads[0];
  }
  const { data, error } = await supabase.from('leads').insert({
    ...input,
    dealership_id: DEALERSHIP_ID
  }).select().single();
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  if (!supabase) return { demo: true };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut();
}
