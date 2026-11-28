import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_TOKEN = Deno.env.get("TELEGRAM_TOKEN")!;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function send(chatId: string, text: string) {
  console.log("📨 Enviando mensaje a Telegram. Chat ID:", chatId);

  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });

  const data = await res.json();
  console.log("📬 Respuesta Telegram:", data);
}

Deno.serve(async (req) => {
  try {
    console.log("🔔 Trigger de cancelación recibido");

    const body = await req.json();
    console.log("📦 Body recibido:", body);

    const { cita_id } = body;

    if (!cita_id) {
      console.warn("⚠️ cita_id no recibido");
      return new Response("cita_id missing", { status: 400 });
    }

    console.log("🔍 Buscando cita con ID:", cita_id);

    const { data: cita, error } = await supabase
      .from("cita")
      .select(`
        fecha_hora,
        paciente_id:perfil!paciente_id (
          nombre,
          telegram_chat_id
        )
      `)
      .eq("id", cita_id)
      .single();

    if (error) {
      console.error("❌ Error consultando cita:", error);
      return new Response("error consultando cita", { status: 500 });
    }

    console.log("📄 Cita obtenida:", cita);

    if (!cita?.paciente_id?.telegram_chat_id) {
      console.log("ℹ️ Paciente sin Telegram vinculado, no se envía mensaje");
      return new Response("ok");
    }

    const fechaTexto = new Date(cita.fecha_hora).toLocaleString("es-BO", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });

    console.log("🕒 Fecha formateada:", fechaTexto);

    const mensaje = `❌ *Cita cancelada*

Hola *${cita.paciente_id.nombre}* 👋
Tu cita programada para:

🕒 *${fechaTexto}*

ha sido cancelada.`;

    await send(cita.paciente_id.telegram_chat_id, mensaje);

    console.log("✅ Notificación de cancelación enviada correctamente");

    return new Response("ok");
  } catch (err) {
    console.error("🔥 Error crítico en función:", err);
    return new Response("error", { status: 500 });
  }
});
