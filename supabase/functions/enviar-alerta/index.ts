// enviar-alerta: avisa por correo al responsable de seguridad cuando hay un bloqueo o intentos sospechosos.
// Destino: secreto ALERTA_EMAIL (si no existe, el mismo correo remitente). No incluye códigos ni contraseñas.
// Solo envía si el evento existe de verdad en la bitácora (así nadie puede disparar correos desde fuera).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendMail } from "./smtp.ts"; // copia idéntica de login-step1/smtp.ts

const TIPOS = ["bloqueo", "codigo_incorrecto", "contrasena_incorrecta", "intento_en_cuenta_bloqueada"];

function esc(s: unknown) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

Deno.serve(async (req) => {
  const res = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });
  try {
    const body = await req.json().catch(() => null);
    if (!body?.user_id || !body?.tipo) return res({ error: "Body inválido" }, 400);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const GMAIL_USER = Deno.env.get("GMAIL_USER");
    const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!SUPABASE_URL || !SERVICE_ROLE || !GMAIL_USER || !GMAIL_APP_PASSWORD) return res({ error: "Falta configuración" }, 500);
    const destino = Deno.env.get("ALERTA_EMAIL") || GMAIL_USER;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const desde = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count } = await admin.from("actividad_sospechosa").select("*", { head: true, count: "exact" })
      .eq("user_id", body.user_id).in("tipo", TIPOS).gte("creado_en", desde);
    if (!count) return res({ error: "Evento no encontrado" }, 403);

    const { data: perfil } = await admin.from("perfil").select("nombre, email, rol").eq("id", body.user_id).maybeSingle();
    const cuenta = perfil?.email ?? "(desconocida)";

    const html = `
<html><body style="background:#fff0f5;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #fbcfe8;border-radius:16px;overflow:hidden;">
    <div style="background:#be123c;padding:16px;color:white;font-weight:600;text-align:center;">Alerta de seguridad</div>
    <div style="padding:20px 24px;color:#4b5563;">
      <p><b>Evento:</b> ${esc(body.tipo)}</p>
      <p><b>Nivel:</b> ${esc(body.nivel)}</p>
      <p><b>Cuenta:</b> ${esc(cuenta)} (${esc(perfil?.rol)})</p>
      <p><b>Fecha:</b> ${esc(new Date().toISOString())}</p>
      <p style="color:#9ca3af;font-size:12px;">Si es un bloqueo, la persona puede desbloquearse con el enlace del correo, o un administrador puede hacerlo desde el panel.</p>
    </div>
  </div>
</body></html>`;

    try {
      await sendMail({ user: GMAIL_USER, pass: GMAIL_APP_PASSWORD, to: destino, subject: `Alerta de seguridad: ${body.tipo}`, html, fromName: "Seguridad – Consultorio Ginecológico" });
    } catch (err) {
      console.error("enviar-alerta no se pudo enviar:", String(err));
      return res({ error: "No se pudo enviar el correo" }, 502);
    }
    return res({ ok: true });
  } catch (err) {
    console.error("enviar-alerta error:", String(err));
    return res({ error: "Error interno" }, 500);
  }
});
