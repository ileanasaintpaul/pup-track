const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const env = {
  supabaseUrl: url ?? 'https://placeholder.supabase.co',
  supabaseAnonKey: anonKey ?? 'placeholder-anon-key',
};
