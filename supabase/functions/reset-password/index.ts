// supabase/functions/reset-password/index.ts
// Cambia la contraseña con el enlace de recuperación (NB-POL-P6-02: 30 minutos, un solo uso).
// - Aplica la política de contraseñas por rol (NB-POL-P3-03).
// - No devuelve detalles internos al navegador (solo quedan en los registros del servidor).
// - Al cambiar la clave cierra todas las sesiones abiertas de la cuenta.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validarClave } from "./politica.ts";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://nova-byte-web.vercel.app",
];

function corsHeaders(req: Request) {
  const origin = req.headers.get("Origin");
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
    "Access-Control-Allow-Credentials": "true",
  };
}

function jsonRes(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(req) },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  try {
    const { token, email, password } = await req.json();

    if (!token || typeof token !== "string") {
      return jsonRes(req, { message: "Falta el token de recuperación" }, 400);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      console.error("reset-password: faltan variables de entorno");
      return jsonRes(req, { message: "Error interno" }, 500);
    }
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1) El enlace debe existir, no estar usado y no haber vencido
    const { data: tokenRow, error: tokenErr } = await admin
      .from("reset_tokens")
      .select("id, user_id, email, expiracion, usado")
      .eq("token", token)
      .maybeSingle();

    if (tokenErr) {
      console.error("reset-password token:", tokenErr);
      return jsonRes(req, { message: "No se pudo verificar el enlace" }, 500);
    }
    if (!tokenRow) return jsonRes(req, { message: "Enlace inválido" }, 401);
    if (tokenRow.usado === true) return jsonRes(req, { message: "Este enlace ya fue usado" }, 401);
    if (new Date(tokenRow.expiracion) < new Date()) {
      return jsonRes(req, { message: "El enlace ya expiró" }, 401);
    }

    // 2) La regla de contraseña depende del rol de la cuenta
    const userId = tokenRow.user_id;
    const { data: perfil } = await admin.from("perfil").select("rol").eq("id", userId).maybeSingle();
    const faltante = validarClave(password, perfil?.rol ?? null);
    if (faltante) return jsonRes(req, { message: faltante }, 400);

    // 3) Cambiar la contraseña
    const { error: updErr } = await admin.auth.admin.updateUserById(userId, { password });
    if (updErr) {
      console.error("reset-password update:", updErr);
      return jsonRes(req, { message: "No se pudo actualizar la contraseña" }, 500);
    }

    // 4) Gastar este enlace y cualquier otro pendiente de la cuenta
    await admin.from("reset_tokens").update({ usado: true }).eq("user_id", userId).eq("usado", false);

    // 5) Primer ingreso completado y sesiones anteriores cerradas
    await admin.from("perfil").update({ primer_login: false }).eq("id", userId);
    const { error: sesErr } = await admin.rpc("cerrar_sesiones_de", { p_user: userId });
    if (sesErr) console.error("reset-password cerrar sesiones:", sesErr);

    // 6) Registro de seguridad
    await admin.from("actividad_sospechosa").insert({
      user_id: userId,
      tipo: "reset_password",
      nivel: "bajo",
      detalle: { email: email || tokenRow.email, fecha: new Date().toISOString() },
    });

    return jsonRes(req, { ok: true });
  } catch (err) {
    console.error("reset-password error:", String(err));
    return jsonRes(req, { message: "Error interno" }, 500);
  }
});
