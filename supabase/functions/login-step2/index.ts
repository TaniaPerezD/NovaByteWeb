// supabase/functions/login-step2/index.ts
// Paso 2 del ingreso: valida el código de 6 dígitos y entrega un token_hash que el navegador canjea por una sesión real.
// - La respuesta es la misma si el correo no existe o el código es incorrecto (no revela cuentas).
// - No guarda el código intentado en la bitácora.
// - Registra el dispositivo desde el que se ingresó (NB-POL-P6-06: dispositivo nuevo).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = ["http://localhost:3000", "https://nova-byte-web.vercel.app"];

function corsHeaders(req: Request) {
  const origin = req.headers.get("Origin");
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
    "Access-Control-Allow-Credentials": "true",
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(req), "Content-Type": "application/json" } });
}

function ipDe(req: Request): string {
  return (req.headers.get("cf-connecting-ip") || (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "").slice(0, 60);
}

async function sha256hex(s: string): Promise<string> {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

const CODIGO_INVALIDO = { error: "Código inválido o expirado" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const cuerpo = await req.json().catch(() => null);
    const email = cuerpo?.email;
    const codigo = cuerpo?.codigo;
    if (typeof email !== "string" || typeof codigo !== "string") return json(req, CODIGO_INVALIDO, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      console.error("login-step2: faltan variables de entorno");
      return json(req, { error: "Error interno" }, 500);
    }
    const ALERTA_URL = `${SUPABASE_URL}/functions/v1/enviar-alerta`;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const ip = ipDe(req);
    const ua = req.headers.get("user-agent") || "";

    const { data: origenBloqueado } = await admin.from("bloqueo_origen").select("hasta").eq("ip", ip).gt("hasta", new Date().toISOString()).maybeSingle();
    if (origenBloqueado) return json(req, { error: "Demasiados intentos desde este origen. Intenta de nuevo más tarde." }, 429);

    const { data: perfil } = await admin.from("perfil").select("id, bloqueado, rol, nombre").eq("email", email).maybeSingle();
    if (!perfil) return json(req, CODIGO_INVALIDO, 401);

    if (perfil.bloqueado === true) {
      await admin.from("actividad_sospechosa").insert({
        user_id: perfil.id,
        tipo: "intento_en_cuenta_bloqueada",
        nivel: "alto",
        detalle: { email, ip, fecha: new Date().toISOString() },
      });
      await fetch(ALERTA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: perfil.id, tipo: "bloqueo", nivel: "alto", detalle: { motivo: "Cuenta bloqueada por múltiples intentos fallidos", fecha: new Date().toISOString() } }),
      }).catch(() => {});
      return json(req, { error: "Cuenta bloqueada" }, 403);
    }

    const user_id = perfil.id;
    const { data: verif } = await admin
      .from("codigo_verificacion")
      .select("*")
      .eq("user_id", user_id)
      .eq("usado", false)
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    const expira = verif ? new Date(verif.expiracion) : new Date(0);
    if (!verif || verif.codigo !== codigo || expira < new Date()) {
      await admin.from("actividad_sospechosa").insert({ user_id, tipo: "codigo_incorrecto", nivel: "medio", detalle: { email, ip } });
      const { count } = await admin
        .from("actividad_sospechosa")
        .select("*", { head: true, count: "exact" })
        .eq("user_id", user_id)
        .eq("tipo", "codigo_incorrecto")
        .gte("creado_en", new Date(Date.now() - 15 * 60 * 1000).toISOString());
      if (count && count >= 2) {
        await fetch(ALERTA_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id, tipo: "codigo_incorrecto", nivel: "medio", detalle: { intentos: count, fecha: new Date().toISOString() } }),
        }).catch(() => {});
      }
      return json(req, CODIGO_INVALIDO, 401);
    }

    await admin.from("codigo_verificacion").update({ usado: true }).eq("id", verif.id);

    // Sesión real: el cliente canjea el token_hash con supabase.auth.verifyOtp
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (linkErr || !linkData?.properties?.hashed_token) {
      console.error("login-step2 generateLink:", linkErr?.message);
      return json(req, { error: "No se pudo generar sesión" }, 500);
    }
    const token_hash = linkData.properties.hashed_token;

    await admin.from("actividad_sospechosa").insert({
      user_id,
      tipo: "inicio_sesion",
      nivel: "bajo",
      detalle: { email, ip: ip || "unknown", userAgent: ua || "unknown", fecha: new Date().toISOString() },
    });

    // Dispositivo de confianza (para detectar dispositivos nuevos)
    try {
      await admin.rpc("registrar_dispositivo", { p_user: user_id, p_huella: await sha256hex(ua), p_ip: ip, p_ua: ua });
    } catch (e) {
      console.error("login-step2 registrar_dispositivo:", String(e));
    }

    return json(req, { ok: true, rol: perfil.rol, nombre: perfil.nombre, email, token_hash });
  } catch (err) {
    console.error("login-step2 error:", String(err));
    return json(req, { error: "Error interno" }, 500);
  }
});
