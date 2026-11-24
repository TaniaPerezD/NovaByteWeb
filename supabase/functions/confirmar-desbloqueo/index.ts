// confirmar-desbloqueo: valida el enlace (30 min, un solo uso) y desbloquea la cuenta (NB-POL-P6-02).
// Solo vale para bloqueos por intentos fallidos; los pedidos por la paciente, por alerta o por el OSI exigen verificar la identidad.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { token } = await req.json();
    if (!token || typeof token !== "string") return json(req, { message: "Falta el enlace de desbloqueo" }, 400);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE) return json(req, { message: "Error de configuración" }, 500);
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Un solo uso y con vigencia: el UPDATE condicionado lo garantiza de forma atómica.
    const { data: filas, error } = await admin.from("desbloqueo_tokens")
      .update({ usado: true })
      .eq("token", token).eq("usado", false).gt("expiracion", new Date().toISOString())
      .select("user_id");
    if (error) { console.error("confirmar-desbloqueo:", error.message); return json(req, { message: "No se pudo verificar el enlace" }, 500); }
    if (!filas || filas.length === 0) return json(req, { message: "El enlace no es válido, ya se usó o expiró" }, 401);

    const userId = filas[0].user_id;

    const { data: perfil } = await admin.from("perfil").select("motivo_bloqueo").eq("id", userId).maybeSingle();
    if (perfil?.motivo_bloqueo && perfil.motivo_bloqueo !== "intentos") {
      await admin.from("actividad_sospechosa").insert({ user_id: userId, tipo: "desbloqueo_requiere_verificacion", nivel: "alto", detalle: { motivo: perfil.motivo_bloqueo, canal: "enlace" } });
      return json(req, { message: "Este bloqueo requiere verificar tu identidad con el consultorio. Comunícate por el canal de ayuda." }, 403);
    }

    await admin.from("perfil").update({ bloqueado: false, motivo_bloqueo: null }).eq("id", userId);
    await admin.from("actividad_sospechosa").insert({ user_id: userId, tipo: "desbloqueo", nivel: "bajo", detalle: { metodo: "enlace_correo", fecha: new Date().toISOString() } });

    return json(req, { ok: true, message: "Cuenta desbloqueada. Ya puedes iniciar sesión." });
  } catch (err) {
    console.error("confirmar-desbloqueo error:", String(err));
    return json(req, { message: "Error interno" }, 500);
  }
});
