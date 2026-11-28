// supabase/functions/signup-medico/index.ts
// Registra un médico. SOLO puede llamarla un usuario con sesión cuyo rol sea medicoAdmin.

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

function generarPasswordTemporal() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE) return json(req, { error: "Faltan variables de entorno" }, 500);
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 0) Solo un medicoAdmin con sesión puede registrar médicos
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!jwt) return json(req, { error: "No autorizado" }, 401);
    const { data: caller, error: callerErr } = await admin.auth.getUser(jwt);
    if (callerErr || !caller?.user) return json(req, { error: "No autorizado" }, 401);
    const { data: callerPerfil } = await admin.from("perfil").select("rol, activo, bloqueado").eq("id", caller.user.id).maybeSingle();
    if (!callerPerfil || callerPerfil.rol !== "medicoAdmin" || callerPerfil.bloqueado === true || callerPerfil.activo === false) {
      return json(req, { error: "No autorizado" }, 403);
    }

    // 1) Validar datos
    const { nombre, apellidos, email, fecha_nacimiento, especialidad } = await req.json();
    if (!nombre || !apellidos || !email || !fecha_nacimiento || !especialidad) {
      return json(req, { error: "Todos los campos son obligatorios" }, 400);
    }
    const emailNorm = String(email).trim().toLowerCase();

    // 2) Crear usuario AUTH (si el correo ya existe, Auth lo rechaza)
    const { data: authUser, error: authErr } = await admin.auth.admin.createUser({ email: emailNorm, password: generarPasswordTemporal(), email_confirm: true });
    if (authErr) {
      const yaExiste = (authErr as { code?: string }).code === "email_exists" || /already|registered|exists/i.test(authErr.message ?? "");
      if (yaExiste) return json(req, { error: "Este correo ya está registrado." }, 409);
      console.error("signup-medico createUser:", authErr.message);
      return json(req, { error: "No se pudo crear usuario." }, 500);
    }

    // 3) Insertar en PERFIL con rol medico
    const { error: perfilErr } = await admin.from("perfil").insert({
      id: authUser.user.id, nombre, apellidos, email: emailNorm, fecha_nacimiento, especialidad,
      rol: "medico", primer_login: true, activo: true, bloqueado: false,
    });
    if (perfilErr) {
      await admin.auth.admin.deleteUser(authUser.user.id); // no dejar un usuario de Auth huérfano
      console.error("signup-medico perfil:", perfilErr.message);
      return json(req, { error: "Error creando perfil." }, 500);
    }

    // 4) Correo de primer acceso (login-step1 con contraseña vacía)
    let correoEnviado = false;
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/login-step1`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SERVICE_ROLE },
        body: JSON.stringify({ email: emailNorm, password: "" }),
      });
      correoEnviado = r.ok;
      if (!r.ok) console.error("signup-medico: login-step1 respondió", r.status);
    } catch (e) {
      console.error("signup-medico: no se pudo llamar a login-step1:", String(e));
    }

    return json(req, {
      ok: true,
      correo_enviado: correoEnviado,
      message: correoEnviado
        ? "Médico registrado exitosamente. Revisa tu correo."
        : "Médico registrado, pero no se pudo enviar el correo de acceso. Intenta enviarlo de nuevo más tarde.",
    });
  } catch (err) {
    console.error("signup-medico error:", String(err));
    return json(req, { error: "Error interno" }, 500);
  }
});
