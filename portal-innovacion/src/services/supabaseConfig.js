// Configuración pública de Supabase, leída desde el .env (ver .env.example).
// Solo va la clave "anon", que está pensada para el navegador.
// NUNCA pongas aquí (ni en ninguna variable REACT_APP_*) la clave service_role
// o sb_secret_*: todo lo que empieza con REACT_APP_ termina dentro del bundle público.

export const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Faltan REACT_APP_SUPABASE_URL y/o REACT_APP_SUPABASE_ANON_KEY. " +
      "Copia .env.example a .env, completa los valores y reinicia `npm start`."
  );
}

// Base de las Edge Functions (login-step1, signup, reset-password, ...)
export const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;
