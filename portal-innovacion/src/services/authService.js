// src/services/authService.js
// Servicio de auth para NovaByteWeb. URL y clave anon vienen del .env (ver supabaseConfig.js)
import { SUPABASE_ANON_KEY, FUNCTIONS_URL as BASE_URL } from "./supabaseConfig";
import { supabase } from "./supabaseClient";

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
  // 1) Cierra la sesión REAL en el servidor (borra la sesión de Auth) con el cliente oficial.
  //    Antes se llamaba a /auth/v1/logout con fetch y credentials:"include": el navegador lo bloquea por CORS,
  //    la función fallaba y nunca se limpiaba nada, así que «Cerrar sesión» no cerraba la sesión.
  try {
    await supabase.auth.signOut({ scope: "global" });
  } catch (e) {
    console.error("signOut error:", e);
  }

  // 2) Pase lo que pase con el servidor, la sesión local siempre se limpia.
  try {
    localStorage.removeItem("nb-user");
    localStorage.removeItem("user-ptin");
    localStorage.removeItem("token-ptin");
    localStorage.removeItem("rol-ptin");
    localStorage.removeItem("uid-ptin");
    Object.keys(localStorage)
      .filter((k) => k.startsWith("sb-") && k.endsWith("-auth-token"))
      .forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.error("Limpieza local:", e);
  }

  return true;
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
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "apikey": SUPABASE_ANON_KEY
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
  // Solo un medicoAdmin con sesión puede registrar médicos: se envía su token, no la clave pública.
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) {
    throw new Error("Debes iniciar sesión como administrador para registrar médicos.");
  }

  const res = await fetch(`${BASE_URL}/signup-medico`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
      "apikey": SUPABASE_ANON_KEY
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

// -----------------------------------------------------------------------------
// DESBLOQUEO POR ENLACE (NB-POL-P6-02): pedir el enlace y confirmarlo
// -----------------------------------------------------------------------------
export async function solicitarDesbloqueo(email) {
  const res = await fetch(`${BASE_URL}/solicitar-desbloqueo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "No se pudo enviar el enlace");
  return data; // { ok: true, message }
}

export async function confirmarDesbloqueo(token) {
  const res = await fetch(`${BASE_URL}/confirmar-desbloqueo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ token }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || "El enlace no es válido, ya se usó o expiró");
  return data; // { ok: true, message }
}
