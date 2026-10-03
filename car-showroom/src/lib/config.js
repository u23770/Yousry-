export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
export const DEALERSHIP_ID = import.meta.env.VITE_DEALERSHIP_ID || '';

export const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY && DEALERSHIP_ID);
