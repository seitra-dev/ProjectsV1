import { createClient } from '@supabase/supabase-js';

// Lee las credenciales del archivo .env.local (o de las variables de entorno en Vercel)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '[Supabase] Missing environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

// Crea la conexión
export const supabase = createClient(supabaseUrl || '', supabaseKey || '');  