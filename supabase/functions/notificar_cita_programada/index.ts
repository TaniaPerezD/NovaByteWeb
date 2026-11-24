import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_TOKEN = Deno.env.get("TELEGRAM_TOKEN")!;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function send(chatId: string, text: string) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });
}

Deno.serve(async (req) => {
  const { cita_id } = await req.json();

  const { data: cita, error } = await supabase
    .from("cita")
    .select(`
      fecha_hora,
      paciente:perfil!paciente_id (
        nombre,
        telegram_chat_id
      )
    `)
    .eq("id", cita_id)
    .single();

  if (error || !cita?.paciente?.telegram_chat_id) {
    return new Response("ok");
  }

  const fechaTexto = new Date(cita.fecha_hora).toLocaleString("es-BO", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  await send(
    cita.paciente.telegram_chat_id,
    `✅ *Cita confirmada*

Hola *${cita.paciente.nombre}* 👋
Tu cita fue confirmada para:

🕒 *${fechaTexto}*`
  );

  return new Response("ok");
});
