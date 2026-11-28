import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// =====================
// CONFIG
// =====================
const TELEGRAM_TOKEN = Deno.env.get("TELEGRAM_TOKEN") ?? "";
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// Supabase client con Service Role
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// =====================
// Helper: Enviar mensaje Telegram
// =====================
async function enviarMensaje(chatId: string, texto: string) {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: texto,
      parse_mode: "Markdown",
    }),
  });

  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram error: ${JSON.stringify(data)}`);
  }
}

// =====================
// Lógica principal
// =====================
async function enviarRecordatorios() {
  console.log("▶️ Iniciando proceso de recordatorios");

  // Hora local Bolivia (UTC-4)
  const ahora = new Date(Date.now() - 4 * 60 * 60 * 1000);

  // Ventana realista: 1 a 10 minutos antes
  const desde = new Date(ahora.getTime() + 1 * 60 * 1000);
  const hasta = new Date(ahora.getTime() + 38 * 60 * 1000);

  console.log("🕒 AHORA:", ahora.toISOString());
  console.log("🟢 DESDE:", desde.toISOString());
  console.log("🔵 HASTA:", hasta.toISOString());

  // 1️⃣ Buscar citas pendientes de recordatorio
  const { data: citas, error } = await supabase
    .from("cita")
    .select("id, paciente_id, fecha_hora")
    .eq("estado", "programada")
    .eq("recordatorio", false)
    .gte("fecha_hora", desde.toISOString())
    .lte("fecha_hora", hasta.toISOString());

  if (error) {
    console.error("❌ Error buscando citas:", error);
    return;
  }

  if (!citas || citas.length === 0) {
    console.log("✅ No hay citas en la ventana");
    return;
  }

  console.log(`📅 Citas encontradas: ${citas.length}`);

  // 2️⃣ Procesar citas
  for (const cita of citas) {
    const { data: perfil } = await supabase
      .from("perfil")
      .select("nombre, telegram_chat_id")
      .eq("id", cita.paciente_id)
      .single();

    if (!perfil?.telegram_chat_id) {
      console.log("ℹ️ Paciente sin Telegram:", perfil?.nombre);
      continue;
    }

    const fechaTexto = new Date(cita.fecha_hora).toLocaleString("es-BO", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });

    const mensaje = `📅 *Recordatorio de cita médica*

Hola *${perfil.nombre}* 👋
Tienes una cita programada para:

🕒 *${fechaTexto}*

Por favor, no olvides asistir.`;

    try {
      // Enviar mensaje
      await enviarMensaje(perfil.telegram_chat_id, mensaje);

      // Marcar como recordatorio enviado
      await supabase
        .from("cita")
        .update({ recordatorio: true })
        .eq("id", cita.id);

      console.log(`✅ Recordatorio enviado y marcado (cita ${cita.id})`);

    } catch (err) {
      console.error("❌ Fallo enviando recordatorio:", err.message);
    }
  }
}

// =====================
// Edge Function
// =====================
Deno.serve(async () => {
  try {
    console.log("🔔 Invocación recibida");
    await enviarRecordatorios();

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("🔥 ERROR CRÍTICO:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
});
