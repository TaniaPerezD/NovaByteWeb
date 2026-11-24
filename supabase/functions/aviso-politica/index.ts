// supabase/functions/aviso-politica/index.ts
// Correo a las cuentas activas cuando cambia una política (NB-POL-P6-07 C6).
// Solo la puede llamar un OSI o un médico administrador con sesión. Sin «confirmar: true» solo cuenta los destinatarios.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendMail } from "./smtp.ts";

const ALLOWED_ORIGINS = ["http://localhost:3000", "https://nova-byte-web.vercel.app"];
const cors = (req: Request) => {
  const o = req.headers.get("Origin");
  return {
    "Access-Control-Allow-Origin": o && ALLOWED_ORIGINS.includes(o) ? o : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
  };
};
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

Deno.serve(async (req) => {
  const res = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors(req), "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  try {
    const URL_ = Deno.env.get("SUPABASE_URL"), SR = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const GU = Deno.env.get("GMAIL_USER"), GP = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!URL_ || !SR || !GU || !GP) return res({ error: "Falta configuración" }, 500);
    const admin = createClient(URL_, SR);
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: u } = await admin.auth.getUser(jwt);
    if (!u?.user) return res({ error: "No autorizado" }, 401);
    const { data: yo } = await admin.from("perfil").select("rol, activo, bloqueado").eq("id", u.user.id).maybeSingle();
    if (!yo || !["osi", "medicoAdmin"].includes(yo.rol) || yo.bloqueado === true || yo.activo === false) return res({ error: "No autorizado" }, 403);

    const { titulo, resumen, confirmar } = await req.json();
    if (typeof titulo !== "string" || titulo.trim().length < 5 || typeof resumen !== "string" || resumen.trim().length < 10) {
      return res({ error: "Escribe el título y el resumen del cambio" }, 400);
    }
    const { data: dest } = await admin.from("perfil").select("nombre, email").eq("activo", true).eq("bloqueado", false).not("email", "is", null).like("email", "%@%").limit(2000);
    const lista = (dest ?? []).filter((p: { email: string | null }) => !!p.email);
    if (confirmar !== true) return res({ ok: true, enviados: 0, destinatarios: lista.length, simulacro: true });

    let enviados = 0, fallidos = 0;
    for (const p of lista) {
      const html = `<html><body style="background:#fff0f5;font-family:system-ui,sans-serif;"><div style="max-width:540px;margin:0 auto;background:#fff;border:1px solid #fbcfe8;border-radius:16px;overflow:hidden;">
        <div style="background:#ec4899;padding:16px;color:#fff;font-weight:600;text-align:center;">${esc(titulo)}</div>
        <div style="padding:20px 24px;color:#4b5563;"><p>Hola ${esc(p.nombre ?? "")},</p><p>${esc(resumen)}</p>
        <p>Puedes leer el texto completo en <a href="https://nova-byte-web.vercel.app/seguridad">la sección de Seguridad</a> de la app.</p></div></div></body></html>`;
      try { await sendMail({ user: GU, pass: GP, to: p.email as string, subject: `${titulo} – Consultorio Ginecológico`, html, fromName: "Consultorio Ginecológico" }); enviados++; }
      catch (e) { fallidos++; console.error("aviso-politica:", String(e).slice(0, 120)); }
    }
    await admin.from("audit_log").insert({ actor_id: u.user.id, actor_rol: yo.rol, accion: "aviso_politica", objeto: "politicas" });
    return res({ ok: true, enviados, fallidos, destinatarios: lista.length });
  } catch (e) {
    console.error("aviso-politica error:", String(e));
    return res({ error: "Error interno" }, 500);
  }
});
