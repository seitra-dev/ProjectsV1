/**
 * Script ONE-TIME: resetea la contraseña de TODOS los usuarios a un valor fijo.
 * Ejecutar: node reset-all-passwords.mjs
 *
 * Requiere SERVICE_ROLE_KEY (no el anon key) — encuéntralo en:
 *   Supabase Dashboard → Settings → API → service_role key
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = 'TU_SUPABASE_URL';       // ej: https://xxxx.supabase.co
const SERVICE_ROLE_KEY  = 'TU_SERVICE_ROLE_KEY';   // empieza con "eyJ..."
const NEW_PASSWORD      = 'Corbeta2026*';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  // 1. Listar todos los usuarios (máx 1000 por página)
  let page = 1;
  let allUsers = [];
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) { console.error('Error listando usuarios:', error.message); process.exit(1); }
    allUsers = allUsers.concat(data.users);
    if (data.users.length < 1000) break;
    page++;
  }

  console.log(`Usuarios encontrados: ${allUsers.length}`);

  // 2. Actualizar contraseña de cada uno
  let ok = 0, fail = 0;
  for (const user of allUsers) {
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: NEW_PASSWORD,
    });
    if (error) {
      console.error(`  ✗ ${user.email}: ${error.message}`);
      fail++;
    } else {
      console.log(`  ✓ ${user.email}`);
      ok++;
    }
  }

  console.log(`\nListo: ${ok} actualizados, ${fail} errores.`);
}

run();
