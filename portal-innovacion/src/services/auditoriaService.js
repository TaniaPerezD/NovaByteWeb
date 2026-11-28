import { supabase } from './supabaseClient';

// Deja constancia en la bitácora de solo escritura de quién consulta, descarga o exporta información
// clínica (NB-POL-P6-08). Nunca debe romper la pantalla: si falla, se ignora.
export async function registrarAcceso(objeto, objetoId = null, cuentaId = null, accion = 'consulta') {
  try {
    await supabase.rpc('registrar_acceso', {
      p_objeto: objeto,
      p_objeto_id: objetoId,
      p_cuenta: cuentaId,
      p_accion: accion,
    });
  } catch (e) {
    // la auditoría no debe impedir usar la pantalla
  }
}
