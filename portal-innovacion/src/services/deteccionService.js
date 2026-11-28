import { supabase } from './supabaseClient';

// Detección y alertas (NB-POL-P6-06). Las reglas se aplican en el servidor; aquí solo se consultan y se revisan.
const resultado = ({ data, error }) => {
  if (error) throw new Error(error.message || 'No se pudo completar la operación');
  return data;
};

export const miAccesoExterior = async () => resultado(await supabase.rpc('mi_acceso_exterior'));

export const habilitarAccesoExterior = async (dias) => resultado(await supabase.rpc('habilitar_acceso_exterior', { p_dias: dias }));

export const quitarAccesoExterior = async () => resultado(await supabase.rpc('quitar_acceso_exterior'));

export const adminAlertas = async (estado = null) => resultado(await supabase.rpc('admin_alertas', { p_estado: estado })) || [];

export const adminAlertasResumen = async () => resultado(await supabase.rpc('admin_alertas_resumen'));

export const adminRevisarAlerta = async (id, estado, nota) =>
  resultado(await supabase.rpc('admin_revisar_alerta', { p_id: id, p_estado: estado, p_nota: nota }));

export const REGLAS = {
  R1: 'Tres bloqueos de la cuenta en 24 horas',
  R2: 'Fallos en 5 o más cuentas desde un mismo origen',
  R3: 'Ingreso desde un país no habilitado',
  R4: 'Descarga desde un dispositivo nuevo',
  R5: 'Descargas por encima del límite',
  R6: 'Sesiones simultáneas desde lugares distintos',
  R8: 'Personal en un expediente sin cita',
  DISP: 'Dispositivo nuevo',
  'LIM-CONS': 'Consultas por encima del límite',
  'P3-04': 'Ingreso del personal fuera de horario',
};

export const ESTADOS_ALERTA = {
  abierta: 'Abierta',
  revisada: 'Revisada',
  falso_positivo: 'Falso positivo',
  confirmada: 'Confirmada',
};
