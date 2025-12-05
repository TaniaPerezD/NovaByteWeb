// src/services/citasService.js

import { supabase } from "../services/supabaseClient";

// Obtener citas del médico entre fechas opcionales
export async function getCitasMedico(perfilId, fechaInicio = null, fechaFin = null) {
  try {
    let query = supabase
      .from("cita")
      .select(`
        id,
        fecha_hora,
        estado,
        tipo_cita,
        paciente:perfil!cita_paciente_id_fkey(nombre, apellidos)
      `)
      .eq("medico_id", perfilId)
      .order("fecha_hora", { ascending: true })

    if (fechaInicio) query = query.gte("fecha_hora", fechaInicio);
    if (fechaFin) query = query.lte("fecha_hora", fechaFin);

    const { data, error } = await query;

    if (error) throw error;
    console.log("Citas obtenidas:", data);
    return data.map(c => ({
      ...c,
      paciente_nombre: `${c.paciente?.nombre ?? ""} ${c.paciente?.apellidos ?? ""}`.trim()
    }));
  } catch (e) {
    console.error("Error al obtener citas:", e);
    return [];
  }
}

// Crear una cita
export async function crearCita({ perfil_id, paciente_id, fecha_hora,tipo_cita }) {
  try {
    const { data, error } = await supabase.from("cita").insert([
      { perfil_id, paciente_id, fecha_hora, tipo_cita, estado: "programada" },
    ]);

    if (error) throw error;

    return data?.[0] ?? null;
  } catch (e) {
    console.error("Error al crear cita:", e);
    return null;
  }
}

// Editar una cita
export async function actualizarCita(id, cambios) {
  try {
    const { data, error } = await supabase
      .from("citas")
      .update({ ...cambios, actualizado_en: new Date() })
      .eq("id", id);

    if (error) throw error;

    return data?.[0] ?? null;
  } catch (e) {
    console.error("Error al actualizar cita:", e);
    return null;
  }
}

// Eliminar una cita
export async function eliminarCita(id) {
  try {
    const { error } = await supabase.from("citas").delete().eq("id", id);

    if (error) throw error;

    return true;
  } catch (e) {
    console.error("Error al eliminar cita:", e);
    return false;
  }
}

// Obtener una sola cita (para previews del modal)
export const getCitaById = async (id) => {
  const { data, error } = await supabase
    .from("cita")
    .select(`
      *,
      perfil_medico:medico_id ( id, nombre, apellidos ),
      perfil_paciente:paciente_id ( id, nombre, apellidos ),

      consulta (
        id,
        motivo,
        archivo_clinico_id,
        archivo:archivo_clinico_id (
          id,
          tipo,
          descripcion
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error al obtener cita:", error);
    return null;
  }
  return data;
};

// Obtener consulta por cita
export async function getConsultaByCita(citaId) {
  const { data, error } = await supabase
    .from("consulta")
    .select("*")
    .eq("cita_id", citaId)
    .maybeSingle();
  if (error) return null;
  return data;
}

// Crear consulta
export const crearConsulta = async (cita, archivoClinicoId) => {
  const payload = {
    cita_id: cita.id,
    paciente_id: cita.paciente_id,
    medico_id: cita.medico_id,
    archivo_clinico_id: archivoClinicoId
  };

  const { data, error } = await supabase
    .from("consulta")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Error creando consulta:", error);
    return null;
  }

  return data;
};

// Obtener archivos clínicos del paciente
export async function getArchivosPaciente(pacienteId) {
  try {
    const { data, error } = await supabase
      .from("archivo_clinico")
      .select("*")
      .eq("paciente_id", pacienteId);
    if (error) throw error;
    return data;
  } catch (e) {
    console.error("Error al obtener archivos clínicos del paciente:", e);
    return [];
  }
}

// Actualizar estado de cita
export async function actualizarEstadoCita(citaId, nuevoEstado) {
  try {
    const { data, error } = await supabase
      .from("cita")
      .update({ estado: nuevoEstado })
      .eq("id", citaId);
    if (error) throw error;
    return data?.[0] ?? null;
  } catch (e) {
    console.error("Error al actualizar estado de cita:", e);
    return null;
  }
}

//archivos clinicos
export const getArchivosClinicos = async (pacienteId) => {
  const { data, error } = await supabase
    .from("archivo_clinico")
    .select("*")
    .eq("paciente_id", pacienteId);

  if (error) {
    console.error("Error obteniendo archivos clínicos:", error);
    return [];
  }

  return data;
};

export const crearArchivoClinico = async (pacienteId) => {
  const { data, error } = await supabase
    .from("archivo_clinico")
    .insert([{ paciente_id: pacienteId }])
    .select()
    .single();

  if (error) {
    console.error("Error creando archivo clínico:", error);
    return null;
  }

  return data;
};