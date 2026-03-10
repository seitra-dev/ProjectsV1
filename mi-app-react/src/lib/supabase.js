// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validación de seguridad para que sepas por qué falla en consola
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ ERROR: Credenciales de Supabase no encontradas. Verifica tu archivo .env o las variables en Vercel.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)