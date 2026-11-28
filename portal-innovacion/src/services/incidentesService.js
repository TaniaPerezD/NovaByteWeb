import { supabase } from './supabaseClient';

// Incidentes y escalamiento (NB-PRO-P6-11, NB-FOR-P6-12 y NB-PRO-P6-13). Las reglas y los plazos se aplican en el servidor.
const ok = ({ data, error }) => {
  if (error) throw new Error(error.message || 'No se pudo completar la operación');
  return data;
};

export const SEVERIDADES = { menor: 'Menor', mayor: 'Mayor', critica: 'Crítica' };
export const ESTADOS_INCIDENTE = { abierto: 'Abierto', en_seguimiento: 'En seguimiento', cerrado: 'Cerrado' };
export const DECISIONES = { trata: 'Tratar el riesgo', acepta: 'Aceptar el riesgo', transfiere: 'Transferir el riesgo' };

export const categorias = async () => ok(await supabase.from('incidente_categoria').select('numero, nombre, ejemplo, responde').order('numero')) || [];
export const resumen = async () => ok(await supabase.rpc('incidentes_resumen'));
export const listarIncidentes = async () => ok(await supabase.rpc('listar_incidentes', { p_estado: null })) || [];
export const obtenerIncidente = async (id) => ok(await supabase.rpc('obtener_incidente', { p_id: id }));
export const crearIncidente = async (p) => ok(await supabase.rpc('crear_incidente', { p }));
export const actualizarIncidente = async (id, p) => ok(await supabase.rpc('actualizar_incidente', { p_id: id, p }));
export const cerrarIncidente = async (id, causa, acciones) => ok(await supabase.rpc('cerrar_incidente', { p_id: id, p_causa: causa, p_acciones: acciones }));
export const marcarAccion = async (id, indice, cumplida) => ok(await supabase.rpc('marcar_accion', { p_id: id, p_indice: indice, p_cumplida: cumplida }));
export const agregarNota = async (id, nota) => ok(await supabase.rpc('agregar_nota_incidente', { p_id: id, p_nota: nota }));
export const reportarEvento = async (descripcion, sistemas) => ok(await supabase.rpc('reportar_evento', { p_descripcion: descripcion, p_sistemas: sistemas || null }));
export const listarEventos = async () => ok(await supabase.rpc('admin_reportes_evento', { p_estado: null })) || [];
export const descartarEvento = async (id, nota) => ok(await supabase.rpc('admin_descartar_reporte', { p_id: id, p_nota: nota }));
export const incidenteDesdeAlerta = async (alerta) => ok(await supabase.rpc('incidente_desde_alerta', { p_alerta: alerta }));
export const registrarAfectadas = async (id, emails) => ok(await supabase.rpc('registrar_afectadas', { p_id: id, p_emails: emails }));
export const comunicarPacientes = async (id, mensaje) => ok(await supabase.rpc('comunicar_pacientes', { p_id: id, p_mensaje: mensaje }));
export const entregarInformePosterior = async (esc, texto) => ok(await supabase.rpc('entregar_informe_posterior', { p_escalamiento: esc, p_texto: texto }));
export const informeMensual = async (anio, mes) => ok(await supabase.rpc('informe_mensual', { p_anio: anio, p_mes: mes }));
export const informeAnual = async (anio) => ok(await supabase.rpc('informe_anual', { p_anio: anio }));
export const enviarInformeMensual = async (anio, mes) => ok(await supabase.rpc('enviar_informe_mensual', { p_anio: anio, p_mes: mes }));
export const iniciarSimulacro = async () => ok(await supabase.rpc('iniciar_simulacro'));
export const listarSimulacros = async () => ok(await supabase.rpc('listar_simulacros')) || [];

// Página pública del Director General (enlace secreto)
export const escalamientoPorToken = async (token) => ok(await supabase.rpc('escalamiento_por_token', { p_token: token }));
export const acusarEscalamiento = async (token, nombre, decision, activaPcn, declaraCrisis, autorizaComunicar) =>
  ok(await supabase.rpc('acusar_escalamiento', {
    p_token: token, p_nombre: nombre, p_decision: decision || null,
    p_activa_pcn: !!activaPcn, p_declara_crisis: !!declaraCrisis, p_autoriza_comunicar: !!autorizaComunicar,
  }));
