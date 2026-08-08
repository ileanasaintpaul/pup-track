const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Faux si le `.env` n'est pas encore rempli — l'app affiche alors l'écran de configuration. */
export const isSupabaseConfigured = Boolean(url && anonKey);

export const env = {
  // Valeurs de repli pour que createClient ne lève pas avant l'écran de configuration.
  supabaseUrl: url ?? 'https://placeholder.supabase.co',
  supabaseAnonKey: anonKey ?? 'placeholder-anon-key',
};
