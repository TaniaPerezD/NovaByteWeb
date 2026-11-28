// supabase/functions/forgot-password/index.ts
// Envía el enlace para crear una contraseña nueva (30 minutos, un solo uso: NB-POL-P6-02).
// No revela si el correo existe: la respuesta es la misma en ambos casos.
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
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders(req) });

  try {
    const { email } = await req.json();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const GMAIL_USER = Deno.env.get("GMAIL_USER");
    const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!SUPABASE_URL || !SERVICE_ROLE) return json(req, { error: "Faltan envs supabase" }, 500);
    if (!email) return json(req, { error: "Email requerido" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: perfil } = await admin.from("perfil").select("id, email, nombre").eq("email", email).maybeSingle();

    // No revelamos si el correo existe o no
    if (!perfil) return json(req, { ok: true });

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      console.error("forgot-password: faltan GMAIL_USER / GMAIL_APP_PASSWORD");
      return json(req, { error: "No se pudo enviar el correo" }, 500);
    }

    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + MINUTOS_ENLACE * 60 * 1000).toISOString();
    await admin.from("reset_tokens").insert({ user_id: perfil.id, email, token, expiracion: expires });

    const resetUrl = `https://nova-byte-web.vercel.app/new-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    const mensajeHTML = `
        <html>
          <body style="background:#fff0f5;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">
            <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #fbcfe8;border-radius:16px;overflow:hidden;">
              <div style="background:#ec4899;padding:16px;color:white;font-weight:600;text-align:center;">Recuperación de contraseña</div>
              <div style="padding:20px 24px;">
                <p style="color:#4b5563;">Hola ${perfil.nombre || ""},</p>
                <p style="color:#4b5563;">Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                <p style="text-align:center;margin:24px 0;">
                  <a href="${resetUrl}" style="background:#ec4899;color:white;text-decoration:none;padding:12px 30px;border-radius:9999px;display:inline-block;">Restablecer contraseña</a>
                </p>
                <p style="color:#9ca3af;font-size:12px;">El enlace vence en ${MINUTOS_ENLACE} minutos y solo puede usarse una vez.</p>
              </div>
              <div style="background:#fdf2f8;padding:10px;text-align:center;font-size:11px;color:#a1a1aa;">© ${new Date().getFullYear()} Consultorio Ginecológico</div>
            </div>
          </body>
        </html>`;

    try {
      await sendMail({ user: GMAIL_USER, pass: GMAIL_APP_PASSWORD, to: email, subject: "Recuperación de contraseña – Consultorio Ginecológico", html: mensajeHTML, fromName: "Seguridad – Consultorio Ginecológico" });
    } catch (err) {
      // El detalle queda solo en los logs (no se expone para no revelar si el correo existe)
      console.error("forgot-password no se pudo enviar el correo:", String(err));
      return json(req, { error: "No se pudo enviar el correo" }, 502);
    }
    return json(req, { ok: true });
  } catch (err) {
    console.error("forgot-password error:", String(err));
    return json(req, { error: "Error interno" }, 500);
  }
});
