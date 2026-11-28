// Bot de Telegram: solo información pública (/start y /horarios).
// Se retiraron /vincular y /citas: cualquiera podía vincular su Telegram al correo de otra persona y ver sus citas.
// El token y el secreto del webhook ya no están en el código: se leen de los secretos TELEGRAM_BOT_TOKEN y TELEGRAM_WEBHOOK_SECRET.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET") ?? "";
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

async function sendMessage(chatId: number, text: string) {
  try {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });
  } catch (e) {
    console.error("Error enviando mensaje:", String(e));
  }
}

async function getHorarios() {
  const { data, error } = await supabase
    .from("horarios_medico")
    .select(`dia_semana, hora_inicio, hora_fin, medico:perfil!perfil_id ( nombre, apellidos, especialidad )`)
    .eq("activo", true)
    .order("dia_semana", { ascending: true })
    .order("hora_inicio", { ascending: true });
  if (error) {
    console.error("Error obteniendo horarios:", error);
    return null;
  }
  return data;
}

const diasSemana = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

Deno.serve(async (req) => {
  try {
    if (!TOKEN || !SECRET) return new Response("Servicio no configurado", { status: 503 });
    const url = new URL(req.url);
    if (url.searchParams.get("secret") !== SECRET) return new Response("Unauthorized", { status: 401 });

    const update = await req.json();
    const message = update.message;
    if (!message || !message.text) return new Response("ok");

    const chatId = message.chat.id;
    const text = String(message.text).trim();

    if (text === "/start") {
      await sendMessage(chatId, "👋 *Bienvenido al Bot Médico*\n\n/horarios - Ver disponibilidad\n\nPara ver o gestionar tus citas usa la app o el sitio web.");
    } else if (text === "/horarios") {
      const horarios = await getHorarios();
      if (!horarios || horarios.length === 0) {
        await sendMessage(chatId, "❌ No hay horarios disponibles en este momento.");
        return new Response("ok");
      }
      const agrupados: Record<string, any[]> = {};
      horarios.forEach((h: any) => {
        const nombre = h.medico ? `${h.medico.nombre} ${h.medico.apellidos ?? ""} (${h.medico.especialidad ?? "General"})` : "Médico";
        (agrupados[nombre] ??= []).push(h);
      });
      let resp = "🩺 *Horarios de Atención por Médico:*\n\n";
      for (const medico in agrupados) {
        resp += `👨‍⚕️ *Dr/a. ${medico}*\n`;
        agrupados[medico].forEach((h) => { resp += `   • ${diasSemana[h.dia_semana]}: ${h.hora_inicio} - ${h.hora_fin}\n`; });
        resp += "\n";
      }
      await sendMessage(chatId, resp);
    } else if (text === "/citas" || text.startsWith("/vincular")) {
      await sendMessage(chatId, "Por seguridad, esta opción está deshabilitada. Consulta tus citas en la app o el sitio web.");
    } else {
      await sendMessage(chatId, "No entiendo ese comando. Intenta /start");
    }
    return new Response("ok");
  } catch (err) {
    console.error("telegram-bot error:", String(err));
    return new Response("error", { status: 500 });
  }
});
