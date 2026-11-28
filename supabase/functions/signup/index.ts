// supabase/functions/signup/index.ts
// Registro de pacientes. El enlace para crear la contraseña sale por el flujo de primer ingreso (login-step1).
// - No revela si el correo ya existe: la respuesta es la misma en ambos casos.
// - Valida los datos en el servidor y limita los registros por origen (5 por hora).
// - Si el perfil no se puede crear, deshace la cuenta de acceso para no dejar usuarios huérfanos.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://nova-byte-web.vercel.app",
];
const MAX_REGISTROS_POR_HORA = 5;

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
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(req) },
  });
}

function generarPasswordTemporal() {
  // Nadie la conoce ni la usa: la persona crea la suya con el enlace del primer ingreso.
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validar(d: Record<string, unknown>): { error?: string; datos?: Record<string, string> } {
  const nombre = String(d.nombre ?? "").trim();
  const apellidos = String(d.apellidos ?? "").trim();
  const email = String(d.email ?? "").trim().toLowerCase();
  const fecha = String(d.fecha_nacimiento ?? "").trim();
  if (nombre.length < 2 || nombre.length > 80) return { error: "Revisa el nombre." };
  if (apellidos.length < 2 || apellidos.length > 80) return { error: "Revisa los apellidos." };
  if (email.length > 254 || !EMAIL_RE.test(email)) return { error: "Revisa el correo electrónico." };
  const f = new Date(fecha + "T00:00:00Z");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || isNaN(f.getTime()) || f > new Date() || f.getUTCFullYear() < 1900) {
    return { error: "Revisa la fecha de nacimiento." };
  }
  return { datos: { nombre, apellidos, email, fecha_nacimiento: fecha } };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders(req) });
  }

  try {
    const entrada = await req.json().catch(() => ({}));
    const v = validar(entrada);
    if (v.error) return json(req, { error: v.error }, 400);
    const { nombre, apellidos, email, fecha_nacimiento } = v.datos!;

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      console.error("signup: faltan variables de entorno");
      return json(req, { error: "Error interno" }, 500);
    }
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "desconocida";

    // Límite por origen
    const desde = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("actividad_sospechosa")
      .select("id", { count: "exact", head: true })
      .eq("tipo", "registro_paciente")
      .gte("creado_en", desde)
      .filter("detalle->>ip", "eq", ip);
    if ((count ?? 0) >= MAX_REGISTROS_POR_HORA) {
      return json(req, { error: "Demasiados registros desde este origen. Intenta más tarde." }, 429);
    }

    // Si el correo ya existe no se crea nada y la respuesta es igual (no se revela su existencia)
    const { data: existente } = await admin.from("perfil").select("id").ilike("email", email).maybeSingle();
    if (existente) return json(req, { ok: true });

    const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
      email,
      password: generarPasswordTemporal(),
      email_confirm: true,
    });
    if (authErr || !authUser?.user) {
      console.error("signup createUser:", authErr);
      // Un correo que existe solo en Auth tampoco se revela
      return json(req, { ok: true });
    }

    const { error: perfilErr } = await admin.from("perfil").insert({
      id: authUser.user.id,
      nombre,
      apellidos,
      email,
      fecha_nacimiento,
      rol: "paciente",
      primer_login: true,
      activo: true,
      bloqueado: false,
    });
    if (perfilErr) {
      console.error("signup perfil:", perfilErr);
      await admin.auth.admin.deleteUser(authUser.user.id);
      return json(req, { error: "No se pudo completar el registro." }, 500);
    }

    await admin.from("actividad_sospechosa").insert({
      user_id: authUser.user.id,
      tipo: "registro_paciente",
      nivel: "bajo",
      detalle: { ip },
    });

    // Enlace para crear la contraseña (primer ingreso)
    await fetch(`${SUPABASE_URL}/functions/v1/login-step1`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SERVICE_ROLE },
      body: JSON.stringify({ email, password: "" }),
    }).catch((e) => console.error("signup login-step1:", String(e)));

    return json(req, { ok: true });
  } catch (err) {
    console.error("signup error:", String(err));
    return json(req, { error: "Error interno" }, 500);
  }
});
