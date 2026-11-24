#!/usr/bin/env node
// Arma el AMBIENTE DE DESARROLLO de NovaByte en un proyecto Supabase aparte (NB-POL-P3-08: desarrollo separado de producción).
// Carga el esquema completo (supabase/esquema/esquema_actual.sql) y los datos de referencia, todo dentro de una transacción:
// si algo falla no queda nada a medias. Nunca toca el proyecto de producción ni copia datos reales de pacientes.
//
// Uso (la cadena de conexión no se escribe en el chat ni en git; se pasa solo por variable de entorno):
//   cd scripts && npm install pg        # una sola vez
//   DATABASE_URL_DEV='postgresql://postgres:<clave>@db.<ref>.supabase.co:5432/postgres' node crear-ambiente-desarrollo.js
// Antes, en el panel del proyecto de desarrollo: Database > Extensions > activar pg_cron y pg_net.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REF_PRODUCCION = 'nvfhmlfbocdiczpxgidu';
const url = process.env.DATABASE_URL_DEV;
if (!url) { console.error('Falta DATABASE_URL_DEV (cadena de conexión del proyecto de DESARROLLO).'); process.exit(1); }
if (url.includes(REF_PRODUCCION)) { console.error('Esa cadena es la de PRODUCCIÓN. Este script solo se usa con un proyecto de desarrollo.'); process.exit(1); }
const m = url.match(/db\.([a-z0-9]{20})\.supabase\.co/) || url.match(/postgres\.([a-z0-9]{20})@/);
if (!m) { console.error('No pude leer la referencia del proyecto en la cadena de conexión.'); process.exit(1); }
const REF_DEV = m[1];

let Client;
try { ({ Client } = require('pg')); } catch (e) { console.error('Falta el paquete pg: ejecuta «npm install pg» en la carpeta scripts.'); process.exit(1); }

const dir = path.join(__dirname, '..', 'supabase', 'esquema');
const token = crypto.randomBytes(24).toString('hex');
const esquema = fs.readFileSync(path.join(dir, 'esquema_actual.sql'), 'utf8')
  .split('__TOKEN_DE_RESPALDO__').join(token)
  .split(REF_PRODUCCION).join(REF_DEV);
const referencia = fs.readFileSync(path.join(dir, 'datos_de_referencia.sql'), 'utf8');

(async () => {
  const db = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await db.connect();
  try {
    const previo = await db.query("select 1 from information_schema.tables where table_schema='public' and table_name in ('perfil','audit_log')");
    if (previo.rowCount && !process.argv.includes('--forzar')) {
      console.error('Este proyecto ya tiene el esquema de NovaByte (perfil / audit_log). No se vuelve a cargar. Usa un proyecto vacío.');
      process.exit(1);
    }
    const ajenas = (await db.query("select table_name from information_schema.tables where table_schema='public' order by 1")).rows.map((r) => r.table_name);
    if (ajenas.length) console.log('Tablas que ya existían y no se tocan:', ajenas.join(', '));
    console.log('Cargando esquema en', REF_DEV, '...');
    await db.query('begin');
    await db.query(esquema);
    await db.query(referencia);
    await db.query('insert into public.respaldo_config (id, token) values (1, $1) on conflict do nothing', [token]);
    await db.query('commit');
    const n = (await db.query("select count(*)::int as n from information_schema.tables where table_schema='public'")).rows[0].n;
    console.log(`Listo: ${n} tablas en public. Ambiente de desarrollo creado.`);
    console.log('\nPasos manuales que faltan (ver supabase/README.md):');
    console.log(' 1. Authentication > Hooks: activar «Custom Access Token» con la función public.hook_exigir_2fa.');
    console.log(' 2. Desplegar las funciones: supabase functions deploy <nombre> --project-ref ' + REF_DEV);
    console.log(' 3. Cargar los secretos de las funciones (SMTP, RESPALDO_CLAVE nueva, correos de dirección) con datos DE PRUEBA.');
    console.log(' 4. Crear cuentas ficticias; nunca copiar datos reales de pacientes al desarrollo.');
  } catch (e) {
    await db.query('rollback').catch(() => {});
    console.error('Falló y se deshizo todo:', e.message);
    process.exit(1);
  } finally {
    await db.end();
  }
})();
