import { supabase } from './supabaseClient';

// Listener para cambios en la consulta específica
export const listenToConsultationChanges = (consultaId, callback) => {
  const channel = supabase
    .channel(`consultation-${consultaId}-changes`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "consulta",
        filter: `id=eq.${consultaId}`
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

// Listener para cambios en exámenes de una consulta
export const listenToExamsChanges = (consultaId, callback) => {
  const channel = supabase
    .channel(`exams-${consultaId}-changes`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "examen",
        filter: `consulta_id=eq.${consultaId}`
      },
      (payload) => {
        console.log("Cambio en exámenes:", payload);
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Listener para cambios en resultados de exámenes
export const listenToExamResultsChanges = (callback) => {
  const channel = supabase
    .channel("exam-results-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "resultado_examen"
      },
      (payload) => {
        console.log("Cambio en resultado de examen:", payload);
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Listener para cambios en signos vitales
export const listenToVitalSignsChanges = (consultaId, callback) => {
  const channel = supabase
    .channel(`vital-signs-${consultaId}-changes`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "signos_vitales",
        filter: `consulta_id=eq.${consultaId}`
      },
      (payload) => {
        console.log("Cambio en signos vitales:", payload);
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Listener para cambios en recetas
export const listenToPrescriptionChanges = (consultaId, callback) => {
  const channel = supabase
    .channel(`prescription-${consultaId}-changes`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "receta",
        filter: `consulta_id=eq.${consultaId}`
      },
      (payload) => {
        console.log("Cambio en receta:", payload);
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Listener para cambios en items de receta
export const listenToPrescriptionItemsChanges = (callback) => {
  const channel = supabase
    .channel("prescription-items-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "receta_item"
      },
      (payload) => {
        console.log("Cambio en items de receta:", payload);
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Listener para cambios en diagnósticos
export const listenToDiagnosisChanges = (consultaId, callback) => {
  const channel = supabase
    .channel(`diagnosis-${consultaId}-changes`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "diagnostico",
        filter: `consulta_id=eq.${consultaId}`
      },
      (payload) => {
        console.log("Cambio en diagnósticos:", payload);
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};