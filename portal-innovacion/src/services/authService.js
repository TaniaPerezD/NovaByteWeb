const BASE_URL = "https://nvfhmlfbocdiczpxgidu.supabase.co/functions/v1";

export async function loginStep1(email, password) {
  const res = await fetch(`${BASE_URL}/login-step1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "No se pudo iniciar sesión");
  }
  // aquí el backend ya envió el correo
  return data; // { ok: true, ... }
}

export async function loginStep2(email, codigo) {
  const res = await fetch(`${BASE_URL}/login-step2`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // MUY IMPORTANTE: para recibir la cookie
    body: JSON.stringify({ email, codigo }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Código inválido o expirado");
  }
  // aquí el backend ya marcó el código como usado y ya puso la cookie
  return data; // ahora mismo devuelve { ok: true }
}

export async function logoutSupabase() {
  try {
    const res = await fetch("https://nvfhmlfbocdiczpxgidu.supabase.co/auth/v1/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!res.ok) throw new Error("Error al cerrar sesión");
    return true;
  } catch (err) {
    console.error("Logout error:", err);
    return false;
  }
}