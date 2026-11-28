#!/usr/bin/env node
// Abre un respaldo cifrado y, si se pide, lo restaura (NB-POL-P5-03, puntos 6 y 8).
//   RESPALDO_CLAVE="tu frase" node scripts/restaurar-respaldo.js archivo.json.gz.enc            -> descifra y resume
//   RESPALDO_CLAVE="tu frase" node scripts/restaurar-respaldo.js archivo.json.gz.enc --salida datos.json
//   RESPALDO_CLAVE=... SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/restaurar-respaldo.js archivo --aplicar
// --aplicar vuelve a escribir las filas (upsert) en el proyecto indicado. OJO: en el proyecto de produccion, desactiva antes
// los triggers de aviso de citas (trg_notificar_cita_programada) o se enviaran correos por cada cita restaurada.
// La bitacora de auditoria (audit_log) NO se restaura: es de solo escritura. Los usuarios de Auth se reactivan con "olvide mi contrasena".
const fs = require('fs');
const zlib = require('zlib');
const crypto = require('crypto');

function descifrar(buf, clave) {
  if (buf.slice(0, 4).toString() !== 'NBR1') throw new Error('Formato de respaldo desconocido');
  const salt = buf.slice(4, 20), iv = buf.slice(20, 32), cuerpo = buf.slice(32);
  const k = crypto.pbkdf2Sync(clave, salt, 200000, 32, 'sha256');
  const d = crypto.createDecipheriv('aes-256-gcm', k, iv);
  d.setAuthTag(cuerpo.slice(cuerpo.length - 16));
  return Buffer.concat([d.update(cuerpo.slice(0, cuerpo.length - 16)), d.final()]);
}
module.exports = { descifrar };
if (require.main !== module) return;

const [archivo, ...resto] = process.argv.slice(2);
const clave = process.env.RESPALDO_CLAVE;
if (!archivo || !clave) { console.error('Uso: RESPALDO_CLAVE="..." node scripts/restaurar-respaldo.js <archivo.json.gz.enc> [--salida datos.json] [--aplicar]'); process.exit(1); }

(async () => {
  const snap = JSON.parse(zlib.gunzipSync(descifrar(fs.readFileSync(archivo), clave)).toString());
  console.log(`Respaldo ${snap.tipo} generado el ${snap.generado_en}`);
  if (snap.tablas) {
    const filas = Object.values(snap.conteos || {}).reduce((a, b) => a + b, 0);
    console.log(`Tablas: ${Object.keys(snap.tablas).length}, filas: ${filas}, usuarios de Auth: ${(snap.usuarios_auth || []).length}`);
  } else {
    console.log('Es una copia de configuracion (esquema, politicas, triggers, funciones, tareas).');
  }
  const i = resto.indexOf('--salida');
  if (i >= 0) { fs.writeFileSync(resto[i + 1], JSON.stringify(snap, null, 2), { mode: 0o600 }); console.log('Escrito en', resto[i + 1]); }
  if (!resto.includes('--aplicar')) return;

  const URL_ = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!URL_ || !KEY) throw new Error('Para --aplicar faltan SUPABASE_URL y SUPABASE_SERVICE_KEY');
  const H = { apikey: KEY, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' };
  const orden = ['perfil', 'terminos', 'archivo_clinico', 'alergia', 'antecedente', 'horarios_medico', 'fechas_sin_atencion', 'cita', 'consulta',
    'signos_vitales', 'diagnostico', 'receta', 'receta_item', 'examen', 'resultado_examen', 'encuesta', 'pregunta', 'respuesta_encuesta',
    'respuesta_pregunta', 'aceptacion_terminos'];
  const excluir = new Set(['audit_log', 'audit_cabeza']);
  const todas = [...orden, ...Object.keys(snap.tablas).filter((t) => !orden.includes(t) && !excluir.has(t))];
  for (const t of todas) {
    const filas = snap.tablas[t];
    if (!filas || !filas.length) continue;
    const pk = t === 'terminos' ? 'version' : 'id';
    for (let d = 0; d < filas.length; d += 500) {
      const r = await fetch(`${URL_}/rest/v1/${t}?on_conflict=${pk}`, { method: 'POST', headers: H, body: JSON.stringify(filas.slice(d, d + 500)) });
      if (!r.ok) throw new Error(`Restaurando ${t}: HTTP ${r.status} ${(await r.text()).slice(0, 160)}`);
    }
    console.log(`  ${t}: ${filas.length} filas`);
  }
  console.log('Restauracion aplicada.');
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
