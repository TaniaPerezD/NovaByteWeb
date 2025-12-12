// src/services/authService.js
// Servicio de auth para NovaByteWeb (sin .env, todo fijo)

// 1) Edge functions base (tu proyecto Supabase)
const BASE_URL = "https://nvfhmlfbocdiczpxgidu.supabase.co/functions/v1";

// 2) Credenciales públicas de Supabase (ANON)
const SUPABASE_URL = "https://nvfhmlfbocdiczpxgidu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52ZmhtbGZib2NkaWN6cHgnaWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNzEyNzUsImV4cCI6MjA3MzY0NzI3NX0.3tnqThhBZblaC3bbH6nfJRD-TKg2WVhkF3RpV2BIHyA";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52ZmhtbGZib2NkaWN6cHhnaWR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA3MTI3NSwiZXhwIjoyMDczNjQ3Mjc1fQ.L0OMyCZNV0hhYM6RvgsW_f-ZtPNbdfDSwIKmAMhJuLQ";   // ⬅ Pega el que funciona
// -----------------------------------------------------------------------------
// LOGIN STEP 1 → envía código o correo de primer login
// -----------------------------------------------------------------------------
export async function loginStep1(email, password) {
  const res = await fetch(`${BASE_URL}/login-step1`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));

  // Si el backend detectó primer login, devolvemos tal cual
  if (data && data.firstTime) {
    return {
      ...data,
      resetUrl: data.resetUrl || null,
    };
  }

  if (!res.ok) {
    throw new Error(data.message || data.error || "No se pudo iniciar sesión");
  }

  return data; // { ok: true, msg?, ... }
}

// -----------------------------------------------------------------------------
// LOGIN STEP 2 → valida código, setea cookie y devuelve rol
// -----------------------------------------------------------------------------
export async function loginStep2(email, codigo) {
  const res = await fetch(`${BASE_URL}/login-step2`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    credentials: "include",
    body: JSON.stringify({ email, codigo }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Código inválido o expirado");
  }

  return data; // { ok: true, rol, nombre, email }
}

// -----------------------------------------------------------------------------
// LOGOUT → cerrar sesión y limpiar storage
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
      const err = await res.json().catch(() => ({}));
      console.error("Logout error:", err);
    }

    localStorage.removeItem("user-ptin");
    localStorage.removeItem("token-ptin");
    localStorage.removeItem("rol-ptin");
    localStorage.removeItem("uid-ptin");

    return true;
  } catch (err) {
    console.error("Logout error:", err);
    return false;
  }
}

// -----------------------------------------------------------------------------
// OLVIDÉ MI CONTRASEÑA → forgot-password (envía link de recuperación)
// -----------------------------------------------------------------------------
export async function sendResetPassword(email) {
  if (!email) throw new Error("Debe ingresar un correo");

  const res = await fetch(`${BASE_URL}/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ email }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data.error ||
        data.message ||
        "No se pudo enviar el correo de recuperación"
    );
  }

  return data; // { ok: true }
}

// -----------------------------------------------------------------------------
// Obtener token desde la URL (para new-password)
// -----------------------------------------------------------------------------
export function getResetTokenFromUrl() {
  const hash = window.location.hash;
  if (hash && hash.includes("access_token=")) {
    const params = new URLSearchParams(hash.substring(1));
    return {
      token: params.get("access_token") || "",
      email: params.get("email") || "",
      type: params.get("type") || "",
    };
  }
  const search = new URLSearchParams(window.location.search);
  return {
    token: search.get("token") || "",
    email: search.get("email") || "",
    type: search.get("type") || "",
  };
}

// -----------------------------------------------------------------------------
// Cambiar contraseña con token (reset-password)
// -----------------------------------------------------------------------------
export async function changePasswordWithToken({ token, password, email }) {
  const res = await fetch(`${BASE_URL}/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ token, password, email }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data.message ||
        data.error ||
        (data.detalle && String(data.detalle)) ||
        "No se pudo cambiar la contraseña"
    );
  }

  return data; // { ok: true }
}
// -----------------------------------------------------------------------------
// SIGN UP PACIENTE → crea usuario + perfil + envía link para crear contraseña
// -----------------------------------------------------------------------------
export async function signUpPaciente({ nombre, apellidos, email, fecha_nacimiento }) {

  const res = await fetch(`${BASE_URL}/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "apikey": SUPABASE_SERVICE_ROLE_KEY
    },
    body: JSON.stringify({
      nombre,
      apellidos,
      email,
      fecha_nacimiento
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data.error ||
      data.message ||
      "No se pudo completar el registro"
    );
  }

  return data; // { ok: true, message }
}
export async function signUpMedico({ nombre, apellidos, email, fecha_nacimiento, especialidad }) {

  const res = await fetch(`${BASE_URL}/signup-medico`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "apikey": SUPABASE_SERVICE_ROLE_KEY
    },
    body: JSON.stringify({
      nombre,
      apellidos,
      email,
      fecha_nacimiento,
      especialidad
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data.error ||
      data.message ||
      "No se pudo completar el registro"
    );
  }

  return data; // { ok: true, message }
}
// -----------------------------------------------------------------------------
// NOTIFICAR CITA COMPLETADA → envía correo al paciente
// -----------------------------------------------------------------------------
export async function notificarCitaCompletada({ cita_id, paciente_id }) {
  try {
    const res = await fetch(
      `${BASE_URL}/notificar-cita-completada`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cita_id,
          paciente_id,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn("No se pudo enviar correo de cita completada:", err);
      return false;
    }

    return true;
  } catch (err) {
    console.warn("Error enviando correo de cita completada:", err);
    return false;
  }
}