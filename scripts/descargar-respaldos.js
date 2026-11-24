#!/usr/bin/env node
// Copia EXTERNA de los respaldos (NB-POL-P5-03, punto 3): baja a una carpeta local los respaldos cifrados
// del almacenamiento privado de Supabase. Sirve para tener al menos una copia fuera del entorno principal.
//   - Solo AGREGA archivos: nunca borra ni sobrescribe lo ya descargado (control de borrado).
//   - Los archivos siguen cifrados: sin RESPALDO_CLAVE no se pueden leer.
// Uso:
//   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_KEY=... node scripts/descargar-respaldos.js [carpeta]
// Recomendado: ejecutarlo al menos una vez al dia y guardar la carpeta en un disco externo o nube distinta.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;
const DESTINO = path.resolve(process.argv[2] || './respaldos-externos');
if (!URL_ || !KEY) { console.error('Faltan SUPABASE_URL y/o SUPABASE_SERVICE_KEY en el entorno.'); process.exit(1); }
const H = { apikey: KEY, 'Content-Type': 'application/json' };

async function listar(prefijo) {
  const r = await fetch(`${URL_}/storage/v1/object/list/respaldos`, { method: 'POST', headers: H, body: JSON.stringify({ prefix: prefijo, limit: 1000 }) });
  if (!r.ok) throw new Error(`Listando ${prefijo || '/'}: HTTP ${r.status}`);
  const items = await r.json();
  let archivos = [];
  for (const it of items) {
    if (it.id === null) archivos = archivos.concat(await listar(prefijo + it.name + '/'));
    else archivos.push(prefijo + it.name);
  }
  return archivos;
}

(async () => {
  fs.mkdirSync(DESTINO, { recursive: true });
  const archivos = await listar('');
  const manifiesto = path.join(DESTINO, 'MANIFIESTO.csv');
  if (!fs.existsSync(manifiesto)) fs.writeFileSync(manifiesto, 'ruta,bytes,sha256,descargado_en\n');
  let nuevos = 0;
  for (const ruta of archivos) {
    const local = path.join(DESTINO, ruta);
    if (fs.existsSync(local)) continue;           // nunca se sobrescribe
    const r = await fetch(`${URL_}/storage/v1/object/respaldos/${ruta}`, { headers: H });
    if (!r.ok) { console.error(`No se pudo bajar ${ruta}: HTTP ${r.status}`); continue; }
    const buf = Buffer.from(await r.arrayBuffer());
    fs.mkdirSync(path.dirname(local), { recursive: true });
    fs.writeFileSync(local, buf, { mode: 0o600 });
    fs.appendFileSync(manifiesto, `${ruta},${buf.length},${crypto.createHash('sha256').update(buf).digest('hex')},${new Date().toISOString()}\n`);
    nuevos++;
  }
  console.log(`Respaldos en la nube: ${archivos.length}. Copiados ahora: ${nuevos}. Carpeta: ${DESTINO}`);
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
