import { supabase } from './supabaseClient';

// Privacidad de la paciente (NB-POL-P6-04) y guía de seguridad (NB-POL-P6-07).
// Todas las reglas se aplican en el servidor; aquí solo se llama a sus funciones.

const dispositivo = () => `${navigator.platform || 'web'} | ${navigator.userAgent}`.slice(0, 180);

const resultado = ({ data, error }) => {
  if (error) throw new Error(error.message || 'No se pudo completar la operación');
  return data;
};

export const TIPOS_SOLICITUD = {
  acceso: 'Ver mis datos',
  rectificacion: 'Corregir mis datos',
  retiro_consentimiento: 'Retirar un consentimiento',
  eliminacion: 'Eliminar mis datos',
};

export const ESTADOS_SOLICITUD = {
  recibida: 'Recibida',
  en_proceso: 'En proceso',
  atendida: 'Atendida',
  rechazada: 'Rechazada',
};

export const consentimientosEstado = async () => resultado(await supabase.rpc('consentimientos_estado'));

export const registrarConsentimiento = async (codigo, otorgado) =>
  resultado(await supabase.rpc('registrar_consentimiento', { p_codigo: codigo, p_otorgado: otorgado, p_dispositivo: dispositivo() }));

export const catalogoPublico = async () =>
  resultado(
    await supabase
      .from('consentimiento_catalogo')
      .select('codigo, version, titulo, que_autoriza, datos_y_uso, quien_ve, conservacion, si_se_retira, obligatorio')
      .eq('vigente', true)
      .order('codigo')
  );

export const crearSolicitudDerechos = async (tipo, detalle) =>
  resultado(await supabase.rpc('crear_solicitud_derechos', { p_tipo: tipo, p_detalle: detalle || null }));

export const misSolicitudesDerechos = async () => resultado(await supabase.rpc('mis_solicitudes_derechos')) || [];

export const misDatos = async () => {
  const datos = resultado(await supabase.rpc('mis_datos'));
  // descargas bloqueadas por seguridad (R4/R5): el servidor responde con un mensaje
  if (datos && datos.bloqueado) throw new Error(datos.mensaje || 'Las descargas están bloqueadas temporalmente por seguridad.');
  return datos;
};

export const recordatorioSeguridadPendiente = async () => {
  const { data, error } = await supabase.rpc('seguridad_recordatorio_pendiente');
  return !error && data === true;
};

export const marcarSeguridadVista = async () => resultado(await supabase.rpc('marcar_seguridad_vista', { p_version: '1.0' }));

export const adminSolicitudesDerechos = async (estado = null) =>
  resultado(await supabase.rpc('admin_solicitudes_derechos', { p_estado: estado })) || [];

export const adminAtenderSolicitud = async (id, estado, respuesta) =>
  resultado(await supabase.rpc('admin_atender_solicitud', { p_id: id, p_estado: estado, p_respuesta: respuesta || null }));
