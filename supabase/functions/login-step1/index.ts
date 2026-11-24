// supabase/functions/login-step1/index.ts
// Paso 1 del ingreso: verifica la contraseña EN EL SERVIDOR (sin abrir sesión de Auth) y envía el código de 6 dígitos.
// Detección (NB-POL-P6-06): origen bloqueado (R2), fallos por origen, región (R3), dispositivo nuevo.
// El correo del código se envía en segundo plano para que la pantalla responda rápido; si falla, queda registrado.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";
import { sendMail } from "./smtp.ts";

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };

const MINUTOS_ENLACE = 30;
const ALLOWED_ORIGINS = ["http://localhost:3000", "https://nova-byte-web.vercel.app"];
// Para que "correo inexistente" tarde lo mismo que "contraseña incorrecta"
const HASH_FALSO = bcrypt.hashSync("clave-falsa-para-igualar-tiempos", 10);

function corsHeaders(req: Request) {
  const origin = req.headers.get("Origin");
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
    "Access-Control-Allow-Credentials": "true",
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(req), "Content-Type": "application/json" } });
}

function generarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function ipDe(req: Request): string {
  return (req.headers.get("cf-connecting-ip") || (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "").slice(0, 60);
}

async function sha256hex(s: string): Promise<string> {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

// País de la IP (dos servicios gratuitos de respaldo y caché de 7 días). Si no se puede saber, devuelve null.
async function paisDe(admin: ReturnType<typeof createClient>, ip: string): Promise<string | null> {
  if (!ip || /^(10\.|192\.168\.|127\.|172\.(1[6-9]|2\d|3[01])\.|::1|fe80)/i.test(ip)) return null;
  const { data: c } = await admin.from("geoip_cache").select("pais, consultado_en").eq("ip", ip).maybeSingle();
  if (c && c.pais && Date.now() - new Date(c.consultado_en).getTime() < 7 * 86400000) return c.pais;
  let pais: string | null = null;
  try {
    const r = await fetch(`https://api.country.is/${encodeURIComponent(ip)}`, { signal: AbortSignal.timeout(2500) });
    if (r.ok) pais = String((await r.json()).country || "").toUpperCase() || null;
  } catch (_) { /* se prueba el respaldo */ }
  if (!pais) {
    try {
      const r = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country_code`, { signal: AbortSignal.timeout(2500) });
      if (r.ok) {
        const j = await r.json();
        if (j.success) pais = String(j.country_code || "").toUpperCase() || null;
      }
    } catch (_) { /* sin país */ }
  }
  if (pais) await admin.from("geoip_cache").upsert({ ip, pais, consultado_en: new Date().toISOString() });
  return pais;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  const cuerpo = await req.json().catch(() => null);
  const email = cuerpo?.email;
  const password = cuerpo?.password;
  if (typeof email !== "string" || !email || email.length > 254) return json(req, { error: "Credenciales inválidas" }, 401);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const GMAIL_USER = Deno.env.get("GMAIL_USER");
  const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");
  if (!SUPABASE_URL || !SERVICE_ROLE || !GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.error("login-step1: faltan variables de entorno");
    return json(req, { error: "Error interno" }, 500);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const ip = ipDe(req);
  const ua = req.headers.get("user-agent") || "";

  // R2: origen bloqueado (5 o más cuentas con fallos en 10 minutos)
  const { data: origenBloqueado } = await admin.from("bloqueo_origen").select("hasta").eq("ip", ip).gt("hasta", new Date().toISOString()).maybeSingle();
  if (origenBloqueado) {
    return json(req, { error: "Demasiados intentos desde este origen. Intenta de nuevo más tarde." }, 429);
  }

  const { data: perfil, error: perfilErr } = await admin
    .from("perfil")
    .select("id, bloqueado, primer_login, nombre, email")
    .eq("email", email)
    .maybeSingle();

  if (perfilErr) {
    console.error("login-step1 perfil:", perfilErr);
    return json(req, { error: "Error al verificar credenciales" }, 500);
  }

  // Correo inexistente: misma respuesta y mismo tiempo que una contraseña incorrecta
  if (!perfil) {
    await bcrypt.compare(String(password ?? ""), HASH_FALSO);
    await admin.rpc("registrar_fallo_ingreso", { p_ip: ip, p_email: email });
    return json(req, { error: "Credenciales inválidas" }, 401);
  }

  if (perfil.bloqueado === true) {
    await admin.from("actividad_sospechosa").insert({
      user_id: perfil.id,
      tipo: "intento_en_cuenta_bloqueada",
      nivel: "alto",
      detalle: { email, ip, fecha: new Date().toISOString() },
    });
    await admin.rpc("registrar_fallo_ingreso", { p_ip: ip, p_email: email });
    return json(req, { error: "Cuenta bloqueada. Contacte al administrador." }, 403);
  }

  // Solo es primer login si en la BD dice primer_login = true y no se mandó contraseña
  const passwordVacio = !password || String(password).trim() === "";
  const esPrimerLogin = perfil.primer_login === true && passwordVacio;

  if (esPrimerLogin) {
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + MINUTOS_ENLACE * 60 * 1000).toISOString();
    await admin.from("reset_tokens").insert({ user_id: perfil.id, email, token, expiracion: expires });

    const resetUrl = `https://nova-byte-web.vercel.app/new-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    const mensajeHTML = `
    <html>
      <body style="background:#fff0f5;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">
        <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #fbcfe8;border-radius:16px;overflow:hidden;">
          <div style="background:#ec4899;padding:16px;color:white;font-weight:600;text-align:center;">Crear contraseña</div>
          <div style="padding:20px 24px;">
            <p style="color:#4b5563;">Hola ${perfil?.nombre || ""},</p>
            <p style="color:#4b5563;">Parece que es tu primer acceso. Crea tu contraseña con el siguiente botón:</p>
            <p style="text-align:center;margin:24px 0;">
              <a href="${resetUrl}" style="background:#ec4899;color:white;text-decoration:none;padding:12px 30px;border-radius:9999px;display:inline-block;">Crear contraseña</a>
            </p>
            <p style="color:#9ca3af;font-size:12px;">Este enlace vence en ${MINUTOS_ENLACE} minutos y solo puede usarse una vez.</p>
          </div>
          <div style="background:#fdf2f8;padding:10px;text-align:center;font-size:11px;color:#a1a1aa;">© ${new Date().getFullYear()} Consultorio Ginecológico</div>
        </div>
      </body>
    </html>`;
    try {
      await sendMail({ user: GMAIL_USER, pass: GMAIL_APP_PASSWORD, to: email, subject: "Crea tu contraseña – Consultorio Ginecológico", html: mensajeHTML, fromName: "Seguridad – Consultorio Ginecológico" });
    } catch (err) {
      console.error("login-step1 (primer login) no se pudo enviar el correo:", String(err));
      return json(req, { error: "No se pudo enviar el correo" }, 502);
    }
    return json(req, { ok: false, firstTime: true, message: "Te enviamos un enlace para crear tu contraseña." });
  }

  // La contraseña se compara (bcrypt) aquí; la sesión solo se entrega en login-step2, tras el código.
  const { data: hash, error: vErr } = await admin.rpc("obtener_hash_password", { p_email: email });
  if (vErr) {
    console.error("login-step1 obtener_hash_password:", vErr.message);
    return json(req, { error: "Error al verificar credenciales" }, 500);
  }
  const coincide = typeof hash === "string" && hash.length > 0 && await bcrypt.compare(String(password ?? ""), hash);

  if (!coincide) {
    // Tres intentos fallidos en 15 minutos bloquean la cuenta (trigger bloquear_por_codigos)
    await admin.from("actividad_sospechosa").insert({
      user_id: perfil.id,
      tipo: "contrasena_incorrecta",
      nivel: "medio",
      detalle: { email, ip, fecha: new Date().toISOString() },
    });
    await admin.rpc("registrar_fallo_ingreso", { p_ip: ip, p_email: email });
    return json(req, { error: "Credenciales inválidas" }, 401);
  }

  // Contraseña correcta: región (R3), dispositivo nuevo y horario del personal
  try {
    const pais = await paisDe(admin, ip);
    const huella = await sha256hex(ua);
    const { data: ev, error: evErr } = await admin.rpc("evaluar_ingreso", { p_user: perfil.id, p_ip: ip, p_pais: pais, p_huella: huella });
    if (evErr) {
      console.error("login-step1 evaluar_ingreso:", evErr.message);
    } else if (ev && ev.permitido === false) {
      if (ev.motivo === "region") {
        return json(req, {
          error: "Por seguridad, tu cuenta no permite ingresar desde fuera de Bolivia. Si estás viajando, habilítalo antes desde «Mi actividad» o comunícate con el consultorio.",
          codigo: "region",
        }, 403);
      }
      return json(req, { error: "Demasiados intentos desde este origen. Intenta de nuevo más tarde." }, 429);
    }
  } catch (err) {
    console.error("login-step1 región:", String(err));
  }

  // 2FA
  const codigo = generarCodigo();
  const { error: insErr } = await admin.from("codigo_verificacion").insert({ user_id: perfil.id, codigo });
  if (insErr) {
    console.error("login-step1 código:", insErr.message);
    return json(req, { error: "No se pudo guardar el código" }, 500);
  }

  const mensajeHTML = `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#fff0f5;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff0f5;padding:24px 0;">
      <tr><td align="center">
        <table width="480" style="background:#ffffff;border-radius:14px;border:1px solid #fbcfe8;">
          <tr><td style="background:#ec4899;padding:16px;text-align:center;color:#fff;font-weight:bold;border-radius:14px 14px 0 0;">Verificación de seguridad</td></tr>
          <tr>
            <td style="padding:24px;">
              <p style="font-size:14px;color:#4b5563;">Recibimos una solicitud para iniciar sesión en tu cuenta. Usa el siguiente código dentro de 5 minutos:</p>
              <p style="text-align:center;margin:24px 0;">
                <span style="display:inline-block;background:#fce7f3;border:1px solid #f9a8d4;color:#9d174d;font-size:26px;letter-spacing:4px;font-weight:700;padding:12px 22px;border-radius:12px;">${codigo}</span>
              </p>
              <p style="font-size:12px;color:#9ca3af;">Si tú no iniciaste sesión, puedes ignorar este mensaje.</p>
            </td>
          </tr>
          <tr><td style="background:#fdf2f8;padding:12px;text-align:center;font-size:11px;color:#a1a1aa;">© ${new Date().getFullYear()} Consultorio Ginecológico</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  // Envío en segundo plano: la persona no espera los ~3 s de Gmail. Si falla, queda en la bitácora (correo_fallido).
  const envio = sendMail({
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
    to: email,
    subject: "Código de verificación – Consultorio Ginecológico",
    html: mensajeHTML,
    fromName: "Seguridad – Consultorio Ginecológico",
  }).catch(async (err) => {
    console.error("login-step1 no se pudo enviar el código:", String(err));
    await admin.from("actividad_sospechosa").insert({
      user_id: perfil.id,
      tipo: "correo_fallido",
      nivel: "alto",
      detalle: { motivo: String(err).slice(0, 200), fecha: new Date().toISOString() },
    });
  });
  EdgeRuntime.waitUntil(envio);

  return json(req, { ok: true, msg: "Código generado; el correo está en camino." });
});
