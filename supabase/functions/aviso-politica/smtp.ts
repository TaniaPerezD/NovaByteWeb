// Envío SMTP a Gmail (puerto 465) que VERIFICA cada respuesta del servidor.
// Si Gmail rechaza algo (contraseña inválida, destinatario, etc.) lanza un Error
// con el paso y la respuesta de Gmail. Nunca incluye la contraseña en el mensaje.
// (Copia idéntica en forgot-password, enviar-alerta, notificar-alerta y las demás funciones que envían correo.)

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64(text: string): string {
  const bytes = enc.encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function wrap76(s: string): string {
  return s.replace(/(.{76})/g, "$1\r\n");
}

async function readReply(conn: Deno.Conn): Promise<{ code: number; text: string }> {
  let text = "";
  while (true) {
    const buf = new Uint8Array(4096);
    const n = await conn.read(buf);
    if (n === null) throw new Error("el servidor cerró la conexión");
    text += dec.decode(buf.subarray(0, n));
    if (!text.endsWith("\n")) continue;
    const lines = text.split(/\r?\n/).filter(Boolean);
    const last = lines[lines.length - 1];
    // Las respuestas multilínea terminan con "NNN " (con espacio)
    if (/^\d{3} /.test(last) || /^\d{3}$/.test(last)) {
      return { code: parseInt(last.slice(0, 3)), text: text.trim() };
    }
  }
}

export async function sendMail(opts: {
  user: string;
  pass: string;
  to: string;
  subject: string;
  html: string;
  fromName: string;
}): Promise<void> {
  let step = "conexión";
  const conn = await Deno.connectTls({ hostname: "smtp.gmail.com", port: 465 });

  const cmd = async (line: string, ok: number[], label: string) => {
    step = label;
    await conn.write(enc.encode(line + "\r\n"));
    const r = await readReply(conn);
    if (!ok.includes(r.code)) {
      throw new Error(`SMTP ${label}: ${r.text.slice(0, 300)}`);
    }
  };

  try {
    step = "saludo";
    const hello = await readReply(conn);
    if (hello.code !== 220) throw new Error(`SMTP saludo: ${hello.text.slice(0, 300)}`);

    await cmd("EHLO supabase", [250], "EHLO");
    await cmd("AUTH LOGIN", [334], "AUTH");
    await cmd(btoa(opts.user), [334], "usuario");
    await cmd(btoa(opts.pass), [235], "contraseña");
    await cmd(`MAIL FROM:<${opts.user}>`, [250], "MAIL FROM");
    await cmd(`RCPT TO:<${opts.to}>`, [250, 251], "RCPT TO");
    await cmd("DATA", [354], "DATA");

    const message =
      `From: =?UTF-8?B?${b64(opts.fromName)}?= <${opts.user}>\r\n` +
      `To: ${opts.to}\r\n` +
      `Subject: =?UTF-8?B?${b64(opts.subject)}?=\r\n` +
      `Date: ${new Date().toUTCString()}\r\n` +
      `Message-ID: <${crypto.randomUUID()}@supabase.local>\r\n` +
      `MIME-Version: 1.0\r\n` +
      `Content-Type: text/html; charset="UTF-8"\r\n` +
      `Content-Transfer-Encoding: base64\r\n\r\n` +
      wrap76(b64(opts.html));

    step = "mensaje";
    await conn.write(enc.encode(message + "\r\n.\r\n"));
    const done = await readReply(conn);
    if (done.code !== 250) throw new Error(`SMTP mensaje: ${done.text.slice(0, 300)}`);

    try {
      await conn.write(enc.encode("QUIT\r\n"));
    } catch (_) { /* ya enviado */ }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(msg.startsWith("SMTP ") ? msg : `SMTP ${step}: ${msg}`);
  } finally {
    try {
      conn.close();
    } catch (_) { /* ya cerrada */ }
  }
}
