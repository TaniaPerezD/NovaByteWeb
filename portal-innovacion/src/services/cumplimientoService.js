import { supabase } from './supabaseClient';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig';

// Retención, informes, actas y avisos (NB-POL-P5-13, NB-POL-P6-07, NB-POL-P6-08). Las reglas viven en el servidor.
const r = ({ data, error }) => {
  if (error) throw new Error(error.message || 'No se pudo completar la operación');
  return data;
};

export const informeRetencion = async () => r(await supabase.rpc('informe_retencion'));
export const informeAlcance = async () => r(await supabase.rpc('informe_alcance'));
export const retenciones = async () => r(await supabase.from('retencion_legal').select('*').order('creada_en', { ascending: false })) || [];
export const crearRetencion = async (asunto, motivo, cuenta, desde, hasta) =>
  r(await supabase.rpc('retencion_crear', { p_asunto: asunto, p_motivo: motivo, p_cuenta: cuenta || null, p_desde: desde || null, p_hasta: hasta || null }));
export const levantarRetencion = async (id, nota) => r(await supabase.rpc('retencion_levantar', { p_id: id, p_nota: nota }));
export const actas = async () => r(await supabase.from('acta_mensual').select('id, periodo, cadena_valida, filas_bitacora, huecos, creada_en').order('periodo', { ascending: false }).limit(24)) || [];
export const generarActa = async () => r(await supabase.rpc('generar_acta_mensual'));
export const exportarPistas = async (desde, hasta) => r(await supabase.rpc('exportar_pistas', { p_desde: desde, p_hasta: hasta }));
export const verificarArchivoPistas = async (archivo) => r(await supabase.rpc('verificar_archivo_pistas', { p_archivo: archivo }));
export const crearAvisoMantenimiento = async (mensaje, desde, hasta) => r(await supabase.rpc('crear_aviso_mantenimiento', { p_mensaje: mensaje, p_desde: desde, p_hasta: hasta }));
export const avisosVigentes = async () => {
  const { data } = await supabase.rpc('avisos_vigentes');
  return data || [];
};

export async function avisarCambioPolitica(titulo, resumen, confirmar) {
  const { data: s } = await supabase.auth.getSession();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/aviso-politica`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s?.session?.access_token}`, apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ titulo, resumen, confirmar }),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(d.error || 'No se pudo enviar');
  return d;
}
