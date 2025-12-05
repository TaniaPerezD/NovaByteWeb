import { supabase } from "../services/supabaseClient";

/* Mapear número de día -> nombre */
const mapDia = {
  1: "lunes",
  2: "martes",
  3: "miercoles",
  4: "jueves",
  5: "viernes",
  6: "sabado",
  7: "domingo",
};

/* Mapa inverso */
const mapDiaReverse = {
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  domingo: 7,
};

/* ------------------------------
   OBTENER HORARIOS DEL MÉDICO
--------------------------------*/
export const getHorariosMedico = async (perfilId) => {
  const { data, error } = await supabase
    .from("horarios_medico")
    .select("*")
    .eq("perfil_id", perfilId);

  if (error) {
    console.error("Error obteniendo horarios:", error);
    return null;
  }

  /* Armar estructura */
  const estado = {
    lunes: { activo: false, rangos: [] },
    martes: { activo: false, rangos: [] },
    miercoles: { activo: false, rangos: [] },
    jueves: { activo: false, rangos: [] },
    viernes: { activo: false, rangos: [] },
    sabado: { activo: false, rangos: [] },
    domingo: { activo: false, rangos: [] },
  };

  data.forEach((item) => {
    const dia = mapDia[item.dia_semana];
    estado[dia].rangos.push({
      inicio: item.hora_inicio,
      fin: item.hora_fin,
    });
  });

  Object.keys(estado).forEach((d) => {
    if (estado[d].rangos.length > 0) {
      estado[d].activo = true;
    } else {
      estado[d].rangos = [{ inicio: "", fin: "" }];
    }
  });

  return estado;
};

/* ------------------------------
   GUARDAR HORARIOS DEL MÉDICO
--------------------------------*/
export const saveHorariosMedico = async (perfilId, horariosState) => {
  /* 1. Borrar horarios anteriores */
  const { error: deleteError } = await supabase
    .from("horarios_medico")
    .delete()
    .eq("perfil_id", perfilId);

  if (deleteError) {
    console.error("Error eliminando horarios previos:", deleteError);
    return { error: deleteError };
  }

  /* 2. Preparar nuevos registros */
  const nuevosRegistros = [];

  Object.keys(horariosState).forEach((dia) => {
    const info = horariosState[dia];

    if (info.activo) {
      info.rangos.forEach((r) => {
        if (r.inicio && r.fin) {
          nuevosRegistros.push({
            perfil_id: perfilId,
            dia_semana: mapDiaReverse[dia],
            hora_inicio: r.inicio,
            hora_fin: r.fin,
          });
        }
      });
    }
  });

  /* 3. Insertar */
  if (nuevosRegistros.length > 0) {
    const { error: insertError } = await supabase
      .from("horarios_medico")
      .insert(nuevosRegistros);

    if (insertError) {
      console.error("Error insertando horarios:", insertError);
      return { error: insertError };
    }
  }

  return { ok: true };
};

/* ------------------------------
   ESCUCHAR CAMBIOS EN HORARIOS
--------------------------------*/
export const listenToHorariosChanges = (callback) => {
  const channel = supabase
    .channel("horarios-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "horarios_medico",
      },
      (payload) => {
        console.log("Cambio detectado en horarios:", payload);
        callback(payload);
      }
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
};
