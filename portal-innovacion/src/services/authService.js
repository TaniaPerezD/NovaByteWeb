// src/services/authService.js
// Servicio de auth para NovaByteWeb (sin .env, todo fijo)

// 1) Edge functions base (tu proyecto Supabase)
const BASE_URL = "https://nvfhmlfbocdiczpxgidu.supabase.co/functions/v1";

// 2) Credenciales públicas de Supabase (ANON) – se pueden usar en frontend
const SUPABASE_URL = "https://nvfhmlfbocdiczpxgidu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52ZmhtbGZib2NkaWN6cHhnaWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNzEyNzUsImV4cCI6MjA3MzY0NzI3NX0.3tnqThhBZblaC3bbH6nfJRD-TKg2WVhkF3RpV2BIHyA";

// -----------------------------------------------------------------------------
// LOGIN STEP 1 → envía código por correo (edge: login-step1)
// Lo llama: src/pages/signin/SignInMain.js
// -----------------------------------------------------------------------------
export async function loginStep1(email, password) {
  const res = await fetch(`${BASE_URL}/login-step1`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // por si algún día protegemos la función
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "No se pudo iniciar sesión");
  }
  // el backend ya mandó el correo con el código
  return data; // { ok: true, msg?, ... }
}

// -----------------------------------------------------------------------------
// LOGIN STEP 2 → valida código, setea cookie y devuelve rol (edge: login-step2)
// Lo llama: pantalla de verificación de código (la que hicimos con el mockup)
// -----------------------------------------------------------------------------
export async function loginStep2(email, codigo) {
  const res = await fetch(`${BASE_URL}/login-step2`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    credentials: "include", // para recibir sb_access_token
    body: JSON.stringify({ email, codigo }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Código inválido o expirado");
  }

  // acá te devuelve el rol para redirigir:
  // paciente → /paciente
  // medico → /medico
  // { ok: true, rol, nombre, email }
  return data;
}

// -----------------------------------------------------------------------------
// LOGOUT → cerrar sesión en Supabase y limpiar storage local
// Lo llama: HeaderPaciente.js / HeaderMedico.js
// -----------------------------------------------------------------------------
export async function logoutSupabase() {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      credentials: "include",
    });

    if (!res.ok) {
      // si Supabase no pudo cerrar, igual limpiamos local
      const err = await res.json().catch(() => ({}));
      console.error("Logout error:", err);
    }

    // limpiar todo lo que usamos para guardar cosas
    try {
      localStorage.removeItem("user-ptin");
      localStorage.removeItem("token-ptin");
      localStorage.removeItem("rol-ptin");
      localStorage.removeItem("uid-ptin");
    } catch (e) {
      // ignore
    }

    return true;
  } catch (err) {
    console.error("Logout error:", err);
    return false;
  }
}

// -----------------------------------------------------------------------------
// OLVIDÉ MI CONTRASEÑA → llama a TU edge function: forgot-password
// Lo llama: src/pages/reset-password/ResetPasswordMain.js (el primer form)
// -----------------------------------------------------------------------------
export async function sendResetPassword(email) {
  if (!email) {
    throw new Error("Debe ingresar un correo");
  }

  const res = await fetch(`${BASE_URL}/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // 👇 estos dos deben coincidir con lo que permitiste en CORS (los pusimos allá)
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      email,
      // por si la función lo quiere usar
      redirect_to: "http://localhost:3000/new-password",
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data.error || data.message || "No se pudo enviar el correo de recuperación"
    );
  }

  return data; // { ok: true }
}

// -----------------------------------------------------------------------------
// ¿Hay token de reset en la URL? (decidir si mostramos el form de nueva pass)
// Lo usa: src/pages/reset-password/ResetPasswordMain.js o el /new-password
// -----------------------------------------------------------------------------
export function hasResetTokenInUrl() {
  // modo hash (#access_token=...)
  const hash = window.location.hash;
  if (hash && hash.includes("access_token=")) {
    return true;
  }
  // modo query (?token=...&email=...)
  const params = new URLSearchParams(window.location.search);
  if (params.get("token")) {
    return true;
  }
  return false;
}

// -----------------------------------------------------------------------------
// Obtener token y email desde la URL (para el componente NewPasswordMain)
// -----------------------------------------------------------------------------
export function getResetTokenFromUrl() {
  // forma #access_token=...&type=recovery&email=...
  const hash = window.location.hash;
  if (hash && hash.includes("access_token=")) {
    const params = new URLSearchParams(hash.substring(1));
    return {
      token: params.get("access_token") || "",
      email: params.get("email") || "",
      type: params.get("type") || "",
    };
  }
  // forma ?token=...&email=...
  const search = new URLSearchParams(window.location.search);
  return {
    token: search.get("token") || "",
    email: search.get("email") || "",
    type: search.get("type") || "",
  };
}

// -----------------------------------------------------------------------------
// Cambiar contraseña usando TU edge function reset-password
// Lo llama: src/pages/new-password/NewPasswordMain.js (el que ya hiciste con email:)
// -----------------------------------------------------------------------------
export async function changePasswordWithToken({ token, password, email }) {
  const res = await fetch(`${BASE_URL}/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // 👇 importante: tu función de reset-password permite también apikey
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ token, password, email }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data.message || data.error || "No se pudo cambiar la contraseña"
    );
  }

  return data; // { ok: true }
}