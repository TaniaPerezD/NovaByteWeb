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

/* -------------------------------------------
   OBTENER HORARIOS AGRUPADOS POR DÍA
--------------------------------------------*/
export const getHorariosMedico = async (perfilId) => {
  const { data, error } = await supabase
    .from("horarios_medico")
    .select("*")
    .eq("perfil_id", perfilId);

  if (error) {
    console.error("Error obteniendo horarios:", error);
    return null;
  }

  const estado = {
    lunes: { activo: true, rangos: [] },
    martes: { activo: true, rangos: [] },
    miercoles: { activo: true, rangos: [] },
    jueves: { activo: true, rangos: [] },
    viernes: { activo: true, rangos: [] },
    sabado: { activo: true, rangos: [] },
    domingo: { activo: true, rangos: [] },
  };

  data.forEach((item) => {
    const dia = mapDia[item.dia_semana];
    estado[dia].rangos.push({
      id: item.id,
      inicio: item.hora_inicio,
      fin: item.hora_fin,
      activo: item.activo,
    });
  });

  // Determinar si un día está activo según algún rango activo
  Object.keys(estado).forEach((d) => {
    estado[d].activo = estado[d].rangos.some((r) => r.activo === true);
    if (estado[d].rangos.length === 0) {
      estado[d].rangos = [{ id: null, inicio: "", fin: "", activo: false }];
    }
  });

  return estado;
};

/* ----------------------------------------------------
   GUARDAR HORARIOS CON SINCRONIZACIÓN INTELIGENTE
-----------------------------------------------------*/
export const saveHorariosMedico = async (perfilId, horariosState) => {
  // Obtener horarios existentes para comparar
  const { data: existentes, error: loadError } = await supabase
    .from("horarios_medico")
    .select("*")
    .eq("perfil_id", perfilId);

  if (loadError) {
    console.error("Error cargando existentes:", loadError);
    return { error: loadError };
  }

  const existentesMap = {};
  existentes.forEach((h) => {
    existentesMap[h.id] = h;
  });

  const updates = [];
  const inserts = [];
  const deletes = new Set(Object.keys(existentesMap));

  // Recorrer UI
  Object.keys(horariosState).forEach((dia) => {
    const info = horariosState[dia];
    const diaSemana = mapDiaReverse[dia];

    info.rangos.forEach((rango) => {
      if (rango.id && existentesMap[rango.id]) {
        // UPDATE
        updates.push({
          id: rango.id,
          changes: {
            hora_inicio: rango.inicio,
            hora_fin: rango.fin,
            activo: info.activo,
          },
        });

        deletes.delete(rango.id);
      } else if (!rango.id && rango.inicio && rango.fin) {
        // INSERT
        inserts.push({
          perfil_id: perfilId,
          dia_semana: diaSemana,
          hora_inicio: rango.inicio,
          hora_fin: rango.fin,
          activo: info.activo,
        });
      }
    });

    // Si el médico cierra un día → marcar todos los existentes como inactivos
    if (!info.activo) {
      existentes.forEach((old) => {
        if (old.dia_semana === diaSemana) {
          updates.push({
            id: old.id,
            changes: { activo: false },
          });
          deletes.delete(old.id);
        }
      });
    }
  });

  // APPLY UPDATES
  for (const u of updates) {
    const { error: updateError } = await supabase
      .from("horarios_medico")
      .update(u.changes)
      .eq("id", u.id);

    if (updateError) {
      console.error("Error en update:", updateError);
      return { error: updateError };
    }
  }

  // APPLY INSERTS
  if (inserts.length > 0) {
    const { error: insertError } = await supabase
      .from("horarios_medico")
      .insert(inserts);

    if (insertError) {
      console.error("Error en insert:", insertError);
      return { error: insertError };
    }
  }

  // APPLY DELETES SOLO PARA RANGOS ELIMINADOS EN LA UI
  for (const id of deletes) {
    const { error: deleteError } = await supabase
      .from("horarios_medico")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error en delete:", deleteError);
      return { error: deleteError };
    }
  }

  return { ok: true };
};

/* -------------------------------------------
   ESCUCHAR CAMBIOS EN TIEMPO REAL (opcional)
--------------------------------------------*/
export const listenToHorariosChanges = (callback) => {
  const channel = supabase
    .channel("horarios-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "horarios_medico" },
      (payload) => callback(payload)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
};
