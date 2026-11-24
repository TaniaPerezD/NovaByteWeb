// supabase/functions/incidentes-correo/index.ts
// Correos de la gestión de incidentes (NB-PRO-P6-11 y NB-PRO-P6-13). Solo recibe un tipo y un identificador:
// todo el contenido sale de la base de datos y cada tipo comprueba que el hecho existe y que no se envió antes,
// así nadie puede disparar correos desde fuera.
//  escalamiento_aviso   aviso directo del OSI al Director General (con enlace de acuse y decisión)
//  escalamiento_segundo repetición del aviso por segundo medio y aviso al suplente (sin acuse en 30 minutos)
//  informe_posterior    informe posterior al Director General
//  reporte_evento       aviso al OSI de un evento reportado (sin el texto, para no enviar datos por correo)
//  comunicar_pacientes  mensaje a las pacientes afectadas (autorizado por el Director General)
//  informe_mensual      informe mensual de incidentes al Director General
//  acciones_vencidas    acciones correctivas vencidas, al Director General
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendMail } from "./smtp.ts";

const PANEL = "https://nova-byte-web.vercel.app/medico-admin/incidentes";
const ACUSE = "https://nova-byte-web.vercel.app/acuse";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function esc(s: unknown) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}
const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("es-BO", { timeZone: "America/La_Paz" }) : "—");
function marco(color: string, titulo: string, cuerpo: string) {
  return `<html><body style="background:#fff0f5;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #fbcfe8;border-radius:16px;overflow:hidden;">
    <div style="background:${color};padding:16px;color:white;font-weight:600;text-align:center;">${esc(titulo)}</div>
    <div style="padding:20px 24px;color:#4b5563;line-height:1.55;">${cuerpo}</div>
    <div style="background:#fdf2f8;padding:10px;text-align:center;font-size:11px;color:#a1a1aa;">Confidencial · No incluye datos clínicos, contraseñas ni claves</div>
  </div></body></html>`;
}
function boton(url: string, texto: string) {
  return `<p style="text-align:center;margin:22px 0;"><a href="${url}" style="background:#ec4899;color:white;text-decoration:none;padding:12px 28px;border-radius:9999px;display:inline-block;">${esc(texto)}</a></p>`;
}
function hex(n: number) {
  return [...crypto.getRandomValues(new Uint8Array(n))].map((x) => x.toString(16).padStart(2, "0")).join("");
}
async function sha256hex(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  const res = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });
  try {
    const body = await req.json().catch(() => null);
    const tipo = body?.tipo;
    const id = body?.id;
    if (typeof tipo !== "string" || typeof id !== "string" || !UUID.test(id)) return res({ error: "Body inválido" }, 400);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const GMAIL_USER = Deno.env.get("GMAIL_USER");
    const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!SUPABASE_URL || !SERVICE_ROLE || !GMAIL_USER || !GMAIL_APP_PASSWORD) return res({ error: "Falta configuración" }, 500);
    const OSI = Deno.env.get("ALERTA_EMAIL") || GMAIL_USER;
    const DG = Deno.env.get("DIRECTOR_EMAIL") || OSI;
    const SUPLENTE = Deno.env.get("SUPLENTE_EMAIL") || "";
    const DG2 = Deno.env.get("DIRECTOR_EMAIL_2") || "";
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const enviar = (to: string, subject: string, html: string) =>
      sendMail({ user: GMAIL_USER, pass: GMAIL_APP_PASSWORD, to, subject, html, fromName: "Seguridad – Consultorio Ginecológico" });
    const reciente = (d: string | null, min: number) => !!d && Date.now() - new Date(d).getTime() < min * 60 * 1000;

    // ---------- Escalamiento: aviso directo (Anexo A) y segundo aviso
    if (tipo === "escalamiento_aviso" || tipo === "escalamiento_segundo") {
      const { data: e } = await admin.from("escalamiento").select("*").eq("id", id).maybeSingle();
      if (!e) return res({ error: "No encontrado" }, 404);
      if (e.acuse_en) return res({ ok: true, omitido: "ya tiene acuse" });
      const segundo = tipo === "escalamiento_segundo";
      if (!segundo && e.aviso_enviado_en) return res({ ok: true, omitido: "ya se avisó" });
      if (segundo && (e.segundo_correo_en || !reciente(e.segundo_aviso_en, 15))) return res({ ok: true, omitido: "segundo aviso ya enviado" });

      let inc: Record<string, unknown> | null = null;
      let categoria = "";
      if (e.incidente_id) {
        const r = await admin.from("incidente").select("*").eq("id", e.incidente_id).maybeSingle();
        inc = r.data;
        const c = await admin.from("incidente_categoria").select("nombre").eq("numero", (inc as any)?.categoria).maybeSingle();
        categoria = c.data?.nombre ?? "";
      }
      const token = hex(32);
      await admin.from("escalamiento").update({ token_hash: await sha256hex(token), token_expira: new Date(Date.now() + 72 * 3600 * 1000).toISOString() }).eq("id", id);
      const enlace = `${ACUSE}?token=${token}`;
      const sim = e.es_simulacro;
      const i = inc as any;
      const recomendacion = sim
        ? "Esto es un simulacro anual: confirma la recepción con el botón para medir el tiempo hasta el acuse."
        : e.severidad === "critica"
          ? "Tratar el riesgo de inmediato; evaluar activar el plan de continuidad (NB-PLN-P7-01) y declarar la crisis (NB-PLN-P7-02); decidir si se comunica a las pacientes (72 horas desde confirmada una filtración)."
          : "Dar seguimiento al incidente y decidir si hace falta activar el plan de continuidad (NB-PLN-P7-01).";
      const cuerpo = `
        ${segundo ? `<p style="color:#b42318;"><b>Segundo aviso:</b> el primer aviso no fue confirmado en 30 minutos.</p>` : ""}
        <p><b>${esc(sim ? "SIMULACRO de escalamiento" : "Incidente " + (i?.numero ?? ""))}</b> · severidad <b>${esc(e.severidad)}</b></p>
        <p><b>Por qué se escala:</b> ${esc(e.disparador)}</p>
        <p><b>Qué pasó:</b> ${esc(sim ? "Simulacro: no hay un incidente real." : i?.descripcion)}</p>
        <p><b>Cuándo:</b> ${esc(fmt(i?.detectado_en ?? e.creado_en))}</p>
        <p><b>Sistemas y datos afectados:</b> ${esc(sim ? "—" : `${i?.sistemas_afectados}${i?.datos_restringidos ? " · Datos Restringidos: " + (i?.datos_restringidos_tipo || "sí") : " · sin Datos Restringidos confirmados"}`)}</p>
        <p><b>Categoría:</b> ${esc(sim ? "—" : categoria)}</p>
        <p><b>Pacientes afectadas (estimado):</b> ${esc(sim ? "—" : i?.pacientes_afectadas ?? "sin dato")}</p>
        <p><b>Medidas de contención:</b> ${esc(sim ? "—" : i?.mitigacion || "en curso")}</p>
        <p><b>Recomendación:</b> ${esc(recomendacion)}</p>
        <p><b>Plazo para confirmar:</b> ${e.plazo_horas === 1 ? "inmediato (máximo 1 hora desde que el OSI tuvo conocimiento)" : "máximo " + e.plazo_horas + " horas"}.</p>
        ${boton(enlace, "Confirmar recepción y decidir")}
        <p style="font-size:12px;color:#9ca3af;">El enlace es personal, vence en 72 horas y no pide contraseña. Con él se confirma la recepción y se registra la decisión (tratar, aceptar o transferir el riesgo; activar el plan de continuidad; declarar la crisis; autorizar la comunicación a las pacientes).</p>`;
      const asunto = `${sim ? "[SIMULACRO] " : ""}${segundo ? "[SEGUNDO AVISO] " : ""}Escalamiento ${e.severidad === "critica" ? "crítico" : "mayor"}${i?.numero ? " · " + i.numero : ""}`;
      const destinos = [DG, ...(segundo ? [DG2, SUPLENTE] : [])].filter((x, k, a) => x && a.indexOf(x) === k);
      let enviados = 0;
      for (const to of destinos) {
        try { await enviar(to, asunto, marco(e.severidad === "critica" ? "#be123c" : "#d97706", sim ? "Simulacro de escalamiento" : "Aviso del OSI al Director General", cuerpo)); enviados++; }
        catch (err) { console.error("incidentes-correo escalamiento:", String(err)); }
      }
      if (enviados === 0) return res({ error: "No se pudo enviar el aviso" }, 502);
      if (segundo) {
        await admin.from("escalamiento").update({ segundo_correo_en: new Date().toISOString() }).eq("id", id);
        if (e.incidente_id) await admin.from("incidente_nota").insert({ incidente_id: e.incidente_id, nota: `Sin acuse en 30 minutos: se repitió el aviso${SUPLENTE ? " y se avisó al suplente designado" : ""}.`, autor: null });
      } else {
        await admin.from("escalamiento").update({ aviso_enviado_en: new Date().toISOString() }).eq("id", id);
        if (e.incidente_id) await admin.from("incidente_nota").insert({ incidente_id: e.incidente_id, nota: `Aviso directo al Director General enviado (${e.severidad}).`, autor: null });
      }
      return res({ ok: true, enviados });
    }

    // ---------- Informe posterior (5 días hábiles)
    if (tipo === "informe_posterior") {
      const { data: e } = await admin.from("escalamiento").select("*").eq("id", id).maybeSingle();
      if (!e || !e.informe_entregado_en || e.informe_correo_en || !reciente(e.informe_entregado_en, 30)) return res({ ok: true, omitido: true });
      const r = e.incidente_id ? await admin.from("incidente").select("numero, descripcion").eq("id", e.incidente_id).maybeSingle() : { data: null };
      await enviar(DG, `Informe posterior del escalamiento${r.data?.numero ? " · " + r.data.numero : ""}`,
        marco("#ec4899", "Informe posterior del OSI", `<p><b>Incidente:</b> ${esc(r.data?.numero ?? "—")} · ${esc(r.data?.descripcion ?? "")}</p><p style="white-space:pre-wrap;">${esc(e.informe_texto)}</p>`));
      await admin.from("escalamiento").update({ informe_correo_en: new Date().toISOString() }).eq("id", id);
      return res({ ok: true });
    }

    // ---------- Evento reportado
    if (tipo === "reporte_evento") {
      const { data: r } = await admin.from("reporte_evento").select("*").eq("id", id).maybeSingle();
      if (!r || r.notificado || !reciente(r.reportado_en, 30)) return res({ ok: true, omitido: true });
      await enviar(OSI, "Evento sospechoso reportado",
        marco("#d97706", "Evento reportado", `<p>Una persona (<b>${esc(r.cargo)}</b>) reportó un evento sospechoso.</p><p><b>Plazo para abrir el registro:</b> ${esc(fmt(new Date(new Date(r.reportado_en).getTime() + 2 * 3600 * 1000).toISOString()))} (2 horas desde el reporte).</p>${boton(PANEL, "Abrir el panel de incidentes")}`));
      await admin.from("reporte_evento").update({ notificado: true }).eq("id", id);
      return res({ ok: true });
    }

    // ---------- Comunicación a pacientes afectadas
    if (tipo === "comunicar_pacientes") {
      const { data: c } = await admin.from("incidente_comunicacion").select("*").eq("id", id).maybeSingle();
      if (!c || c.enviada_en || !reciente(c.creada_en, 30)) return res({ ok: true, omitido: true });
      const { data: afectadas } = await admin.from("incidente_afectada").select("paciente_id").eq("incidente_id", c.incidente_id);
      const ids = (afectadas ?? []).map((a: { paciente_id: string }) => a.paciente_id);
      const { data: pacientes } = await admin.from("perfil").select("email, nombre").in("id", ids).eq("rol", "paciente");
      const html = (nombre: string) => marco("#ec4899", "Aviso de seguridad de NovaByte",
        `<p>Hola ${esc(nombre)},</p><p style="white-space:pre-wrap;">${esc(c.mensaje)}</p><p style="font-size:12px;color:#9ca3af;">Puedes ver tu actividad en «Mi actividad» y tus opciones en «Mi privacidad» dentro de la app. Este mensaje no incluye datos clínicos.</p>`);
      let ok = 0;
      const lista = pacientes ?? [];
      for (let k = 0; k < lista.length; k += 3) {
        const lote = await Promise.allSettled(lista.slice(k, k + 3).map((p: { email: string; nombre: string | null }) => enviar(p.email, "Aviso de seguridad – Consultorio Ginecológico", html(p.nombre ?? ""))));
        ok += lote.filter((x) => x.status === "fulfilled").length;
      }
      await admin.from("incidente_comunicacion").update({ enviada_en: new Date().toISOString(), destinatarios: ok }).eq("id", id);
      await admin.from("incidente_nota").insert({ incidente_id: c.incidente_id, nota: `Comunicación a pacientes enviada a ${ok} de ${lista.length} cuenta(s).`, autor: null });
      return res({ ok: true, enviados: ok, total: lista.length });
    }

    // ---------- Informe mensual
    if (tipo === "informe_mensual") {
      const { data: inf } = await admin.from("informe_incidentes").select("*").eq("id", id).maybeSingle();
      if (!inf || inf.enviado_en) return res({ ok: true, omitido: true });
      const [anio, mes] = String(inf.periodo).split("-").map(Number);
      const { data: d, error } = await admin.rpc("informe_mensual", { p_anio: anio, p_mes: mes });
      if (error || !d) return res({ error: "No se pudo armar el informe" }, 500);
      const filas = (d.por_categoria as { numero: number; nombre: string; total: number; criticos: number }[]).filter((x) => x.total > 0)
        .map((x) => `<tr><td style="padding:4px 8px;border-bottom:1px solid #f1d5d5;">${x.numero}. ${esc(x.nombre)}</td><td style="padding:4px 8px;border-bottom:1px solid #f1d5d5;text-align:right;">${x.total}</td><td style="padding:4px 8px;border-bottom:1px solid #f1d5d5;text-align:right;">${x.criticos}</td></tr>`).join("");
      const m = (d.mitigaciones as { numero: string; mitigacion: string }[]).map((x) => `<li><b>${esc(x.numero)}:</b> ${esc(x.mitigacion)}</li>`).join("");
      const cuerpo = `
        <p><b>Periodo:</b> ${esc(d.periodo)} · <b>Incidentes:</b> ${d.total} (menores ${d.por_severidad.menor}, mayores ${d.por_severidad.mayor}, críticos ${d.por_severidad.critica})</p>
        ${d.total > 0 ? `<table style="width:100%;border-collapse:collapse;font-size:14px;"><tr><th style="text-align:left;padding:4px 8px;">Categoría</th><th style="padding:4px 8px;">Cantidad</th><th style="padding:4px 8px;">Críticos</th></tr>${filas}</table>` : "<p>Sin incidentes en el periodo.</p>"}
        <p><b>Impacto total:</b> ${d.impacto.horas_interrupcion} h de interrupción · ${d.impacto.pacientes_afectadas} paciente(s) afectada(s) · ${d.impacto.registros_afectados} registro(s) · ${d.impacto.horas_respuesta} h de trabajo de respuesta · ${d.impacto.con_datos_restringidos} con Datos Restringidos.</p>
        ${m ? `<p><b>Medidas de mitigación aplicadas:</b></p><ul>${m}</ul>` : ""}
        <p><b>Acciones correctivas:</b> ${d.acciones.total} en total · ${d.acciones.cumplidas} cumplidas · ${d.acciones.vencidas} vencidas.</p>${boton(PANEL, "Abrir el panel de incidentes")}`;
      await enviar(DG, `Informe mensual de incidentes · ${d.periodo}`, marco("#ec4899", "Informe mensual de incidentes de seguridad", cuerpo));
      await admin.from("informe_incidentes").update({ enviado_en: new Date().toISOString() }).eq("id", id);
      return res({ ok: true });
    }

    // ---------- Acciones correctivas vencidas
    if (tipo === "acciones_vencidas") {
      const { data: i } = await admin.from("incidente").select("numero, acciones, acciones_vencidas_escaladas_en, acciones_correo_en").eq("id", id).maybeSingle();
      if (!i || i.acciones_correo_en || !reciente(i.acciones_vencidas_escaladas_en, 15)) return res({ ok: true, omitido: true });
      const hoy = new Date().toISOString().slice(0, 10);
      const venc = (i.acciones as { accion: string; responsable: string; fecha: string; cumplida: boolean }[]).filter((a) => !a.cumplida && a.fecha < hoy);
      await enviar(DG, `Acciones correctivas vencidas · ${i.numero}`,
        marco("#d97706", "Acciones correctivas vencidas", `<p>El incidente <b>${esc(i.numero)}</b> tiene acciones sin cumplir:</p><ul>${venc.map((a) => `<li>${esc(a.accion)} — ${esc(a.responsable)} (venció ${esc(a.fecha)})</li>`).join("")}</ul>${boton(PANEL, "Abrir el panel de incidentes")}`));
      await admin.from("incidente").update({ acciones_correo_en: new Date().toISOString() }).eq("id", id);
      return res({ ok: true });
    }

    return res({ error: "Tipo no válido" }, 400);
  } catch (err) {
    console.error("incidentes-correo error:", String(err));
    return res({ error: "Error interno" }, 500);
  }
});
