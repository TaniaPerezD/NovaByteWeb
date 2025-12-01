import { supabase } from "../services/supabaseClient";

export const listenToPatientChanges = (callback) => {
    const channel = supabase
      .channel("patient-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "perfil" // <-- tu tabla real en Supabase
        },
        (payload) => {
          console.log("Cambio detectado:", payload);
          callback(payload);
        }
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  };
  