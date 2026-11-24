// solicitar-desbloqueo: envía un enlace de 30 minutos y un solo uso para desbloquear la cuenta (NB-POL-P6-02).
// Solo para bloqueos por intentos fallidos. Si el bloqueo lo pidió la paciente, lo generó una alerta o lo ordenó el OSI,
// se exige verificar la identidad con el consultorio (NB-PRO-P6-05) y NO se envía enlace.
// Responde SIEMPRE lo mismo para no revelar si el correo existe o está bloqueado.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendMail } from "./smtp.ts"; // copia idéntica de login-step1/smtp.ts

const MINUTOS_ENLACE = 30;
const ALLOWED_ORIGINS = ["http://localhost:3000", "https://nova-byte-web.vercel.app"];

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
function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(req), "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const { email } = await req.json();
    if (!email) return json(req, { error: "Email requerido" }, 400);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const GMAIL_USER = Deno.env.get("GMAIL_USER");
    const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!SUPABASE_URL || !SERVICE_ROLE || !GMAIL_USER || !GMAIL_APP_PASSWORD) {
      console.error("solicitar-desbloqueo: faltan variables de entorno");
      return json(req, { error: "No se pudo procesar la solicitud" }, 500);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const generica = () => json(req, { ok: true, message: "Si la cuenta existe y está bloqueada, enviamos un enlace de desbloqueo a su correo." });

    const { data: perfil } = await admin.from("perfil").select("id, nombre, email, bloqueado, motivo_bloqueo").eq("email", email).maybeSingle();
    if (!perfil || perfil.bloqueado !== true) return generica();

    // Bloqueo pedido por la paciente, por alerta o por el OSI: requiere verificación de identidad, no hay enlace automático.
    if (perfil.motivo_bloqueo && perfil.motivo_bloqueo !== "intentos") {
      await admin.from("actividad_sospechosa").insert({ user_id: perfil.id, tipo: "desbloqueo_requiere_verificacion", nivel: "alto", detalle: { motivo: perfil.motivo_bloqueo } });
      return generica();
    }

    // Tres bloqueos en 24 horas: ya no es automático, hay que verificar la identidad con el administrador.
    const desde24 = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count: bloqueos } = await admin.from("actividad_sospechosa").select("*", { head: true, count: "exact" })
      .eq("user_id", perfil.id).eq("tipo", "bloqueo").gte("creado_en", desde24);
    if ((bloqueos ?? 0) >= 3) {
      await admin.from("actividad_sospechosa").insert({ user_id: perfil.id, tipo: "desbloqueo_requiere_verificacion", nivel: "alto", detalle: { bloqueos_24h: bloqueos } });
      return generica();
    }

    // Máximo un enlace cada 2 minutos por cuenta (evita inundar el correo).
    const hace2 = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { count: recientes } = await admin.from("desbloqueo_tokens").select("*", { head: true, count: "exact" })
      .eq("user_id", perfil.id).gte("creado_en", hace2);
    if ((recientes ?? 0) > 0) return generica();

    const token = crypto.randomUUID();
    const { error: insErr } = await admin.from("desbloqueo_tokens").insert({
      user_id: perfil.id, token, expiracion: new Date(Date.now() + MINUTOS_ENLACE * 60 * 1000).toISOString(),
    });
    if (insErr) { console.error("solicitar-desbloqueo insert:", insErr.message); return json(req, { error: "No se pudo procesar la solicitud" }, 500); }

    const origin = req.headers.get("Origin");
    const base = origin && ALLOWED_ORIGINS.includes(origin) && !origin.includes("localhost") ? origin : "https://nova-byte-web.vercel.app";
    const url = `${base}/desbloquear?token=${encodeURIComponent(token)}`;

    const html = `
<html><body style="background:#fff0f5;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #fbcfe8;border-radius:16px;overflow:hidden;">
    <div style="background:#ec4899;padding:16px;color:white;font-weight:600;text-align:center;">Desbloquear cuenta</div>
    <div style="padding:20px 24px;">
      <p style="color:#4b5563;">Hola ${perfil.nombre || ""},</p>
      <p style="color:#4b5563;">Tu cuenta se bloqueó por varios intentos fallidos. Si fuiste tú, usa este botón para desbloquearla:</p>
      <p style="text-align:center;margin:24px 0;"><a href="${url}" style="background:#ec4899;color:white;text-decoration:none;padding:12px 30px;border-radius:9999px;display:inline-block;">Desbloquear mi cuenta</a></p>
      <p style="color:#9ca3af;font-size:12px;">El enlace vence en ${MINUTOS_ENLACE} minutos y solo puede usarse una vez. Si no fuiste tú, ignora este mensaje y cambia tu contraseña.</p>
    </div>
    <div style="background:#fdf2f8;padding:10px;text-align:center;font-size:11px;color:#a1a1aa;">© ${new Date().getFullYear()} Consultorio Ginecológico</div>
  </div>
</body></html>`;

    try {
      await sendMail({ user: GMAIL_USER, pass: GMAIL_APP_PASSWORD, to: email, subject: "Desbloquea tu cuenta – Consultorio Ginecológico", html, fromName: "Seguridad – Consultorio Ginecológico" });
    } catch (err) {
      console.error("solicitar-desbloqueo no se pudo enviar el correo:", String(err));
      return json(req, { error: "No se pudo enviar el correo" }, 502);
    }

    await admin.from("actividad_sospechosa").insert({ user_id: perfil.id, tipo: "desbloqueo_solicitado", nivel: "bajo", detalle: { fecha: new Date().toISOString() } });
    return generica();
  } catch (err) {
    console.error("solicitar-desbloqueo error:", String(err));
    return json(req, { error: "Error interno" }, 500);
  }
});
