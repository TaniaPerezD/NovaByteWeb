// supabase/functions/notificar-alerta/index.ts
// Avisa por correo de una alerta de seguridad (NB-POL-P6-06, 6.3): al OSI y, si corresponde, a la paciente.
// Solo envía si la alerta existe de verdad, es reciente y no se avisó antes: nadie puede disparar correos desde fuera.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendMail } from "./smtp.ts";

const PANEL = "https://nova-byte-web.vercel.app/medico-admin/alertas";

const PACIENTE: Record<string, { asunto: string; texto: string }> = {
  R1: { asunto: "Tu cuenta se bloqueó varias veces", texto: "Tu cuenta se bloqueó tres veces en las últimas 24 horas por intentos fallidos. Si no fuiste tú, comunícate con el consultorio." },
  R3: { asunto: "Bloqueamos un ingreso desde otro país", texto: "Alguien intentó ingresar a tu cuenta desde fuera de Bolivia y lo bloqueamos. Si fuiste tú y estás viajando, habilita el acceso desde «Mi actividad» antes de salir. Si no fuiste tú, no hace falta que hagas nada: tu cuenta está segura." },
  R4: { asunto: "Bloqueamos una descarga de tus datos", texto: "Se intentó descargar tu información desde un dispositivo nuevo. Por seguridad bloqueamos las descargas por 24 horas. Si no fuiste tú, bloquea tu cuenta desde «Mi actividad» o llama al consultorio." },
  R5: { asunto: "Límite de descargas alcanzado", texto: "Alcanzaste el límite de 10 descargas por hora, así que las bloqueamos por 1 hora. Si no fuiste tú, bloquea tu cuenta desde «Mi actividad»." },
  R6: { asunto: "Cerramos todas tus sesiones", texto: "Detectamos tu cuenta abierta al mismo tiempo desde lugares distintos y, por seguridad, cerramos todas las sesiones. Si no fuiste tú, cambia tu contraseña y bloquea tu cuenta desde «Mi actividad»." },
  DISP: { asunto: "Ingresaste desde un dispositivo nuevo", texto: "Tu cuenta se abrió desde un dispositivo que no habíamos visto antes. Si fuiste tú, no hagas nada. Si no fuiste tú, cambia tu contraseña y bloquea tu cuenta desde «Mi actividad»." },
  "LIM-CONS": { asunto: "Confirma tu identidad de nuevo", texto: "Consultaste tus resultados muchas veces en poco tiempo. Por seguridad, la próxima vez te pediremos confirmar tu identidad con un código nuevo." },
};

function esc(s: unknown) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

function marco(color: string, titulo: string, cuerpo: string) {
  return `<html><body style="background:#fff0f5;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">
  <div style="max-width:540px;margin:0 auto;background:#fff;border:1px solid #fbcfe8;border-radius:16px;overflow:hidden;">
    <div style="background:${color};padding:16px;color:white;font-weight:600;text-align:center;">${esc(titulo)}</div>
    <div style="padding:20px 24px;color:#4b5563;">${cuerpo}</div>
  </div></body></html>`;
}

Deno.serve(async (req) => {
  const res = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });
  try {
    const body = await req.json().catch(() => null);
    const id = body?.alerta_id;
    if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return res({ error: "Body inválido" }, 400);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const GMAIL_USER = Deno.env.get("GMAIL_USER");
    const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!SUPABASE_URL || !SERVICE_ROLE || !GMAIL_USER || !GMAIL_APP_PASSWORD) return res({ error: "Falta configuración" }, 500);
    const destinoOsi = Deno.env.get("ALERTA_EMAIL") || GMAIL_USER;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: a } = await admin.from("alerta_seguridad").select("*").eq("id", id).maybeSingle();
    if (!a) return res({ error: "Alerta no encontrada" }, 404);
    if (Date.now() - new Date(a.creada_en).getTime() > 15 * 60 * 1000) return res({ error: "Alerta antigua" }, 403);

    let perfil: { nombre: string | null; email: string | null; rol: string | null } | null = null;
    if (a.user_id) {
      const r = await admin.from("perfil").select("nombre, email, rol").eq("id", a.user_id).maybeSingle();
      perfil = r.data;
    }
    const critica = a.nivel === "critica";
    const plazo = new Date(a.vence_revision).toLocaleString("es-BO", { timeZone: "America/La_Paz" });
    const resultado = { osi: false, paciente: false };

    if (!a.notificada_osi) {
      const html = marco(critica ? "#be123c" : "#d97706", `Alerta de seguridad ${a.regla}${critica ? " (crítica)" : ""}`, `
        <p><b>${esc(a.titulo)}</b></p>
        <p><b>Regla:</b> ${esc(a.regla)} · <b>Nivel:</b> ${critica ? "crítica (revisar en 1 hora)" : "normal (revisar en 1 día hábil)"}</p>
        <p><b>Cuenta:</b> ${esc(perfil?.email ?? "(sin cuenta)")} ${perfil?.rol ? "(" + esc(perfil.rol) + ")" : ""}</p>
        <p><b>Origen (IP):</b> ${esc(a.ip ?? "—")}</p>
        <p><b>Revisar antes de:</b> ${esc(plazo)}</p>
        <p style="text-align:center;margin:22px 0;"><a href="${PANEL}" style="background:#ec4899;color:white;text-decoration:none;padding:10px 26px;border-radius:9999px;display:inline-block;">Abrir el panel de alertas</a></p>
        <p style="color:#9ca3af;font-size:12px;">No incluye contraseñas ni códigos. Marca la alerta como revisada, falso positivo o confirmada en el panel.</p>`);
      try {
        await sendMail({ user: GMAIL_USER, pass: GMAIL_APP_PASSWORD, to: destinoOsi, subject: `[${critica ? "CRÍTICA" : "Normal"}] Alerta ${a.regla}: ${a.titulo}`, html, fromName: "Seguridad – Consultorio Ginecológico" });
        resultado.osi = true;
        await admin.from("alerta_seguridad").update({ notificada_osi: true }).eq("id", id);
      } catch (err) {
        console.error("notificar-alerta OSI:", String(err));
      }
    }

    const msg = PACIENTE[a.regla];
    if (!a.notificada_paciente && a.avisar_paciente && perfil?.email && msg) {
      const html = marco("#ec4899", msg.asunto, `<p>Hola ${esc(perfil.nombre ?? "")},</p><p>${esc(msg.texto)}</p>
        <p style="color:#9ca3af;font-size:12px;">Puedes ver tu actividad reciente en «Mi actividad» dentro de la app.</p>`);
      try {
        await sendMail({ user: GMAIL_USER, pass: GMAIL_APP_PASSWORD, to: perfil.email, subject: `${msg.asunto} – Consultorio Ginecológico`, html, fromName: "Seguridad – Consultorio Ginecológico" });
        resultado.paciente = true;
        await admin.from("alerta_seguridad").update({ notificada_paciente: true }).eq("id", id);
      } catch (err) {
        console.error("notificar-alerta paciente:", String(err));
      }
    }
    return res({ ok: true, ...resultado });
  } catch (err) {
    console.error("notificar-alerta error:", String(err));
    return res({ error: "Error interno" }, 500);
  }
});
