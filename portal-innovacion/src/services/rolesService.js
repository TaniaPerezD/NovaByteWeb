import { supabase } from './supabaseClient';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig';

// Matriz de roles NB-MAT-P3-07. Los permisos los decide el servidor; aquí solo se consulta y se pide el alta.
const resultado = ({ data, error }) => {
  if (error) throw new Error(error.message || 'No se pudo completar la operación');
  return data;
};

export const ROLES = {
  paciente: 'Paciente', medico: 'Médico tratante', recepcion: 'Recepción / Administración', director: 'Director General',
  soporte: 'Técnico de Soporte y Mantenimiento', desarrollador: 'Desarrollador (Web/Móvil)', dba: 'Administrador de BD (DBA)',
  infra: 'Administrador de Infraestructura y Cloud', ml: 'Especialista en IA y ML', osi: 'Oficial de Seguridad (OSI)',
  medicoAdmin: 'Médico administrador (rol heredado)',
};
export const MODULOS = {
  agenda: 'Agenda y citas', expediente: 'Expediente clínico', imagenes: 'Imágenes de mama', analitica: 'Analítica por médico',
  bd_produccion: 'Base de datos de producción', datasets_ml: 'Datasets anonimizados (ML)',
};
// Dónde aterriza cada rol después de iniciar sesión
export const INICIO_POR_ROL = {
  paciente: '/paciente', medico: '/medico', medicoAdmin: '/medico-admin', recepcion: '/recepcion', director: '/direccion',
  osi: '/seguridad-osi', soporte: '/personal', desarrollador: '/sin-modulos', dba: '/sin-modulos', infra: '/sin-modulos', ml: '/sin-modulos',
};

export const matrizPermisos = async () => resultado(await supabase.rpc('matriz_permisos')) || [];
export const matrizEstado = async () => resultado(await supabase.rpc('matriz_estado'));
export const personalLista = async () => resultado(await supabase.rpc('personal_lista')) || [];
export const reasignarRol = async (id, rol, motivo) => resultado(await supabase.rpc('reasignar_rol', { p_user: id, p_rol: rol, p_motivo: motivo }));
export const recepcionDirectorio = async () => resultado(await supabase.rpc('recepcion_directorio')) || [];
export const dashboardKpis = async (desde, hasta) => resultado(await supabase.rpc('get_dashboard_kpis', { fecha_inicio_param: desde, fecha_fin_param: hasta }));

export async function altaPersonal(datos) {
  const { data: s } = await supabase.auth.getSession();
  const token = s?.session?.access_token;
  if (!token) throw new Error('Inicia sesión de nuevo para dar de alta personal.');
  const res = await fetch(`${SUPABASE_URL}/functions/v1/signup-personal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify(datos),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || 'No se pudo crear la cuenta');
  return data;
}
