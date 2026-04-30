// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validación de seguridad para que sepas por qué falla en consola
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ ERROR: Credenciales de Supabase no encontradas. Verifica tu archivo .env o las variables en Vercel.");
}

// El SDK de Supabase JS v2 usa Web Locks (navigator.locks) internamente.
// En redes corporativas/proxies esto cuelga indefinidamente.
// Anulamos el lock con una función no-op para evitar el bloqueo.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'implicit',
    lock: async (_name, _acquireTimeout, fn) => fn(),
  }
})