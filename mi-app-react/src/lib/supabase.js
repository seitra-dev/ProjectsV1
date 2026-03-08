import { createClient } from '@supabase/supabase-js';

// Lee las credenciales del archivo .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Crea la conexión
export const supabase = createClient(supabaseUrl, supabaseKey); 