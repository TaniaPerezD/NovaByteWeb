// respaldo: copias de seguridad de la base (NB-POL-P5-03).
//  - 'horario' y 'diario': copia completa de los datos; 'config': esquema, politicas, triggers, funciones y tareas.
//  - Siempre comprimidas y CIFRADAS (AES-256-GCM) con la clave del secreto RESPALDO_CLAVE, que no se guarda junto a la copia.
//    Sin esa clave NO se guarda nada: las copias con datos restringidos jamas quedan en claro.
//  - Solo la invocan las tareas programadas, con un token que valida la base (x-cron-token).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUCKET = "respaldos";
const enc = new TextEncoder();
const dec = new TextDecoder();
const MAGIA = enc.encode("NBR1");

// ---------- utilidades ----------
async function aBytes(s: ReadableStream): Promise<Uint8Array> {
  return new Uint8Array(await new Response(s).arrayBuffer());
}
const gzip = (b: Uint8Array) => aBytes(new Blob([b]).stream().pipeThrough(new CompressionStream("gzip")));
const gunzip = (b: Uint8Array) => aBytes(new Blob([b]).stream().pipeThrough(new DecompressionStream("gzip")));

async function claveAes(pass: string, salt: Uint8Array) {
  const base = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 200000, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"],
  );
}
async function cifrar(datos: Uint8Array, pass: string): Promise<Uint8Array> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const k = await claveAes(pass, salt);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, datos));
  const out = new Uint8Array(4 + 16 + 12 + ct.length);
  out.set(MAGIA, 0); out.set(salt, 4); out.set(iv, 20); out.set(ct, 32);
  return out;
}
async function descifrar(b: Uint8Array, pass: string): Promise<Uint8Array> {
  if (dec.decode(b.slice(0, 4)) !== "NBR1") throw new Error("Formato de respaldo desconocido");
  const k = await claveAes(pass, b.slice(4, 20));
  return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: b.slice(20, 32) }, k, b.slice(32)));
}
async function sha256(b: Uint8Array): Promise<string> {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", b))].map((x) => x.toString(16).padStart(2, "0")).join("");
}
const p2 = (n: number) => String(n).padStart(2, "0");

// deno-lint-ignore no-explicit-any
type Admin = any;

// Cada tabla se lee ordenada por su clave primaria real (no todas tienen «id»): la pregunta se la hacemos a la base.
async function leerTabla(admin: Admin, t: string): Promise<unknown[]> {
  const { data: orden, error: eo } = await admin.rpc("columnas_orden_respaldo", { p_tabla: t });
  if (eo) throw new Error(`Orden de ${t}: ${eo.message}`);
  const cols: string[] = Array.isArray(orden) && orden.length ? orden : ["id"];
  const filas: unknown[] = [];
  for (let d = 0; ; d += 1000) {
    let q = admin.from(t).select("*");
    for (const c of cols) q = q.order(c, { ascending: true });
    const { data, error } = await q.range(d, d + 999);
    if (error) throw new Error(`Leyendo ${t}: ${error.message}`);
    filas.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return filas;
}

async function usuariosAuth(admin: Admin) {
  const out: unknown[] = [];
  for (let p = 1; ; p++) {
    const { data, error } = await admin.auth.admin.listUsers({ page: p, perPage: 1000 });
    if (error) throw new Error(`Leyendo usuarios: ${error.message}`);
    out.push(...data.users.map((u: Admin) => ({ id: u.id, email: u.email, created_at: u.created_at, email_confirmed_at: u.email_confirmed_at, last_sign_in_at: u.last_sign_in_at })));
    if (data.users.length < 1000) break;
  }
  return out; // sin contrasenas: tras una restauracion total las cuentas se reactivan con "olvide mi contrasena"
}

async function subir(admin: Admin, ruta: string, cuerpo: Uint8Array) {
  const { error } = await admin.storage.from(BUCKET).upload(ruta, new Blob([cuerpo]), { upsert: true, contentType: "application/octet-stream" });
  if (error) throw new Error(`Subiendo ${ruta}: ${error.message}`);
}

// ---------- fallos e incidencias (P5-03, punto 9) ----------
async function falla(admin: Admin, tipo: string, mensaje: string) {
  await admin.from("respaldo_registro").insert({ tipo, ok: false, error: mensaje.slice(0, 300) });
  const { data: ult } = await admin.from("respaldo_registro").select("ok").order("id", { ascending: false }).limit(2);
  const consecutivos = (ult ?? []).length >= 2 && (ult ?? []).every((r: Admin) => r.ok === false);
  if (consecutivos) {
    const { count } = await admin.from("respaldo_incidente").select("*", { head: true, count: "exact" }).eq("tipo", "respaldo_fallido").is("cerrado_en", null);
    if (!count) {
      await admin.from("respaldo_incidente").insert({ tipo: "respaldo_fallido", detalle: `Fallos consecutivos de respaldo (${tipo}): ${mensaje}`.slice(0, 300) });
      await admin.from("audit_log").insert({ actor_rol: "sistema", accion: "respaldo_fallido", objeto: "respaldos" });
    }
  }
  console.error("respaldo fallido:", mensaje);
  return { ok: false, error: mensaje };
}

// ---------- retencion ----------
// horarios 48 h, diarios 35 dias, configuracion 400 dias. Los MENSUALES (10 anos) no se borran automaticamente nunca.
async function aplicarRetencion(admin: Admin, ahora: Date): Promise<number> {
  // Retención legal (NB-POL-P5-13 C2): mientras haya un proceso abierto no se destruye ningún respaldo
  const { data: retenida } = await admin.rpc("hay_retencion_activa");
  if (retenida === true) return 0;
  const reglas: [string, number][] = [["horario", 48 * 3600e3], ["diario", 35 * 864e5], ["config", 400 * 864e5]];
  let n = 0;
  for (const [tipo, ms] of reglas) {
    const lim = new Date(ahora.getTime() - ms).toISOString();
    const { data } = await admin.from("respaldo_registro").select("id, ruta").eq("tipo", tipo).eq("ok", true).is("borrado_en", null).lt("creado_en", lim).limit(200);
    for (const r of data ?? []) {
      if (r.ruta) {
        const { error } = await admin.storage.from(BUCKET).remove([r.ruta]);
        if (error) continue;
      }
      await admin.from("respaldo_registro").update({ borrado_en: ahora.toISOString() }).eq("id", r.id);
      n++;
    }
  }
  return n;
}

// ---------- respaldar ----------
async function respaldar(admin: Admin, tipo: string, clave: string) {
  if (!["horario", "diario", "config"].includes(tipo)) return { ok: false, error: "Tipo no valido" };
  if (clave.length < 12) {
    return await falla(admin, tipo, "Falta el secreto RESPALDO_CLAVE (minimo 12 caracteres): las copias no se guardan sin cifrar");
  }
  const ahora = new Date();
  try {
    const snapshot: Record<string, unknown> = { formato: 1, tipo, generado_en: ahora.toISOString() };
    let nTablas = 0; let nFilas = 0;
    if (tipo === "config") {
      const { data, error } = await admin.rpc("exportar_configuracion");
      if (error) throw new Error(`Configuracion: ${error.message}`);
      snapshot.configuracion = data;
    } else {
      const { data: lista, error } = await admin.rpc("listar_tablas_respaldo");
      if (error) throw new Error(`Lista de tablas: ${error.message}`);
      const tablas: Record<string, unknown[]> = {}; const conteos: Record<string, number> = {};
      for (const t of lista as string[]) { tablas[t] = await leerTabla(admin, t); conteos[t] = tablas[t].length; nFilas += tablas[t].length; }
      nTablas = (lista as string[]).length;
      snapshot.tablas = tablas; snapshot.conteos = conteos; snapshot.usuarios_auth = await usuariosAuth(admin);
    }
    const crudo = enc.encode(JSON.stringify(snapshot));
    const huella = await sha256(crudo);
    const cuerpo = await cifrar(await gzip(crudo), clave);
    const f = `${ahora.getUTCFullYear()}-${p2(ahora.getUTCMonth() + 1)}-${p2(ahora.getUTCDate())}`;
    const ruta = tipo === "diario" ? `diario/${f}.json.gz.enc` : tipo === "config" ? `config/${f}.json.gz.enc`
      : `horario/${f}/${p2(ahora.getUTCHours())}${p2(ahora.getUTCMinutes())}.json.gz.enc`;
    await subir(admin, ruta, cuerpo);
    const reg = { ruta, bytes: cuerpo.length, tablas: nTablas, filas: nFilas, sha256: huella, cifrado: true, ok: true };
    await admin.from("respaldo_registro").insert({ tipo, ...reg });

    if (tipo === "diario" && ahora.getUTCDate() === 1) { // copia mensual: conservacion de 10 anos
      const rutaM = `mensual/${f.slice(0, 7)}.json.gz.enc`;
      await subir(admin, rutaM, cuerpo);
      await admin.from("respaldo_registro").insert({ tipo: "mensual", ...reg, ruta: rutaM });
    }
    await admin.from("respaldo_incidente").update({ cerrado_en: ahora.toISOString() }).is("cerrado_en", null).in("tipo", ["respaldo_fallido", "rpo_excedido"]);
    const borrados = await aplicarRetencion(admin, ahora);
    return { ok: true, tipo, ruta, bytes: cuerpo.length, tablas: nTablas, filas: nFilas, borrados };
  } catch (e) {
    return await falla(admin, tipo, e instanceof Error ? e.message : String(e));
  }
}

// ---------- prueba de restauracion (P5-03, punto 6): lectura, integridad y criterio clinico ----------
async function probarRestauracion(admin: Admin, clave: string, rutaPedida?: string) {
  let ruta = rutaPedida ?? null;
  try {
    if (clave.length < 12) throw new Error("Falta el secreto RESPALDO_CLAVE");
    if (!ruta) {
      const { data } = await admin.from("respaldo_registro").select("ruta").in("tipo", ["horario", "diario"]).eq("ok", true).is("borrado_en", null).order("id", { ascending: false }).limit(1);
      ruta = data?.[0]?.ruta ?? null;
    }
    if (!ruta) throw new Error("No hay respaldos para probar");
    const { data: reg } = await admin.from("respaldo_registro").select("sha256").eq("ruta", ruta).eq("ok", true).order("id", { ascending: false }).limit(1);
    const { data: blob, error } = await admin.storage.from(BUCKET).download(ruta);
    if (error || !blob) throw new Error(`Lectura: ${error?.message ?? "sin datos"}`);
    const crudo = await gunzip(await descifrar(new Uint8Array(await blob.arrayBuffer()), clave));
    const integro = !!reg?.[0]?.sha256 && (await sha256(crudo)) === reg[0].sha256;
    const snapshot = JSON.parse(dec.decode(crudo));
    if (!snapshot.tablas) throw new Error("El respaldo no contiene datos para restaurar");
    const { data: v, error: e2 } = await admin.rpc("verificar_restauracion", { p_snapshot: snapshot });
    if (e2) throw new Error(`Restauracion: ${e2.message}`);
    const ok = integro && v.ok === true;
    await admin.from("respaldo_prueba_restauracion").insert({ respaldo_ruta: ruta, ok, detalle: { lectura: true, integridad_sha256: integro, ...v } });
    return { ok, ruta, integridad: integro, tablas: v.tablas, filas: v.filas, huerfanos: v.huerfanos };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await admin.from("respaldo_prueba_restauracion").insert({ respaldo_ruta: ruta, ok: false, detalle: { error: msg } });
    return { ok: false, error: msg };
  }
}

Deno.serve(async (req) => {
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const sr = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !sr) return json({ error: "Falta configuracion" }, 500);
    const admin = createClient(url, sr);
    const { data: tokOk } = await admin.rpc("validar_token_respaldo", { p_token: req.headers.get("x-cron-token") ?? "" });
    if (!tokOk) return json({ error: "No autorizado" }, 401);
    const body = await req.json().catch(() => ({}));
    const clave = Deno.env.get("RESPALDO_CLAVE") ?? "";
    if ((body.accion ?? "respaldar") === "respaldar") return json(await respaldar(admin, body.tipo ?? "horario", clave));
    if (body.accion === "probar_restauracion") return json(await probarRestauracion(admin, clave, body.ruta));
    return json({ error: "Accion no valida" }, 400);
  } catch (e) {
    console.error("respaldo error:", String(e));
    return json({ error: "Error interno" }, 500);
  }
});
