// src/services/citasService.js

import { supabase } from "../services/supabaseClient";

// Obtener citas del médico entre fechas opcionales
export async function getCitasMedico(perfilId, fechaInicio = null, fechaFin = null) {
  try {
    let query = supabase
      .from("cita")
      .select("*")
      .eq("medico_id", perfilId)
      .order("fecha_hora", { ascending: true })

    if (fechaInicio) query = query.gte("fecha_hora", fechaInicio);
    if (fechaFin) query = query.lte("fecha_hora", fechaFin);

    const { data, error } = await query;

    if (error) throw error;
    return data;
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
export async function getCitaById(id) {
  try {
    const { data, error } = await supabase
      .from("cita")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return data;
  } catch (e) {
    console.error("Error al obtener cita por ID:", e);
    return null;
  }
}