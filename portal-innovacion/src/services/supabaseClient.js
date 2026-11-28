import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabaseConfig";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Pistas de auditoría de lectura (NB-POL-P3-05, C1 y NB-POL-P6-08): cada vez que cualquier pantalla lee una tabla clínica
// queda un registro «lectura:<tabla>» en la bitácora de solo escritura (quién, cuándo y desde dónde; sin el contenido).
// Se registra una vez cada 5 minutos por tabla para no llenar la bitácora. Nunca debe romper la pantalla.
// Límite: esto cubre el uso de la aplicación; una lectura directa de la API con una sesión válida la frenan las reglas de
// acceso por fila, pero no pasa por aquí.
const TABLAS_CLINICAS = new Set([
  'cita', 'consulta', 'examen', 'resultado_examen', 'receta', 'receta_item', 'diagnostico',
  'alergia', 'antecedente', 'archivo_clinico', 'signos_vitales',
]);
const CADA_MS = 5 * 60 * 1000;
const ultimaLectura = new Map();

function registrarLectura(tabla) {
  const ahora = Date.now();
  if (ahora - (ultimaLectura.get(tabla) || 0) < CADA_MS) return;
  ultimaLectura.set(tabla, ahora);
  try {
    Promise.resolve(supabase.rpc('registrar_acceso', { p_objeto: `lectura:${tabla}`, p_accion: 'consulta' })).then(() => {}, () => {});
  } catch (e) {
    // la auditoría no debe impedir usar la pantalla
  }
}

const desdeOriginal = supabase.from.bind(supabase);
supabase.from = (tabla) => {
  const consulta = desdeOriginal(tabla);
  if (!TABLAS_CLINICAS.has(tabla)) return consulta;
  const seleccionar = consulta.select.bind(consulta);
  consulta.select = (...args) => {
    registrarLectura(tabla);
    return seleccionar(...args);
  };
  return consulta;
};
