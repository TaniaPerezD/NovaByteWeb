import { supabase } from './supabaseClient';

// Listener para cambios en archivos clínicos
export const listenToClinicalFileChanges = (pacienteId, callback) => {
  const channel = supabase
    .channel("clinical-file-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "archivo_clinico",
        filter: `paciente_id=eq.${pacienteId}`
      },
      (payload) => {
        console.log("Cambio en archivo clínico:", payload);
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Listener para cambios en consultas
export const listenToConsultationChanges = (callback) => {
  const channel = supabase
    .channel("consultation-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "consulta"
      },
      (payload) => {
        console.log("Cambio en consulta:", payload);
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};