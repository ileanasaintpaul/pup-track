import { createClient } from '@supabase/supabase-js';

import { env } from './env';

// Types de la base : `npm run db:types` génère src/types/database.ts depuis le
// projet Supabase. Passe-le en générique ici une fois généré :
//   createClient<Database>(...)
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Le lien magique renvoie la session dans l'URL du navigateur.
    detectSessionInUrl: true,
  },
});
