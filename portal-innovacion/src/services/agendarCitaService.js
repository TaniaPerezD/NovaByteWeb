// agendarCitaService.js
// Servicio completo para manejo de citas, horarios, fechas sin atención y generación de horarios disponibles

import { supabase } from "../services/supabaseClient";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

// ---------------------------------------------------
// 1. Obtener lista de médicos
// ---------------------------------------------------
export const getMedicos = async () => {
  const { data, error } = await supabase
    .from("perfil")
    .select("id, nombre, apellidos, especialidad")
    .not("especialidad", "is", null) // médicos son los que tienen especialidad
    .order("nombre", { ascending: true });

  if (error) throw error;

  // Unificar nombre + apellido como nombre_completo
  return data.map((m) => ({
    id: m.id,
    nombre_completo: `${m.nombre} ${m.apellidos}`,
    especialidad: m.especialidad
  }));
};

// ---------------------------------------------------
// 2. Obtener horarios del médico
// ---------------------------------------------------
export const getHorariosMedico = async (perfil_id) => {
  const { data, error } = await supabase
    .from("horarios_medico")
    .select("*")
    .eq("perfil_id", perfil_id)
    .eq("activo", true)
    .order("dia_semana", { ascending: true })
    .order("hora_inicio", { ascending: true });

  if (error) throw error;
  return data;
};

// ---------------------------------------------------
// 3. Obtener fechas sin atención (vacaciones, feriados)
// ---------------------------------------------------
export const getFechasSinAtencion = async (perfil_id) => {
  const { data, error } = await supabase
    .from("fechas_sin_atencion")
    .select("*")
    .eq("perfil_id", perfil_id);

  if (error) throw error;
  return data;
};

// ---------------------------------------------------
// 4. Obtener citas ya reservadas para ese día
// ---------------------------------------------------
export const getCitasPorDia = async (perfil_id, fechaISO) => {
  const { data, error } = await supabase
    .from("cita")
    .select("*")
    .eq("medico_id", perfil_id)
    .gte("fecha_hora", `${fechaISO}T00:00:00`)
    .lte("fecha_hora", `${fechaISO}T23:59:59`);

  if (error) throw error;
  return data;
};

// ---------------------------------------------------
// 5. Detectar si un día está dentro de vacaciones
// ---------------------------------------------------
const estaEnVacaciones = (fecha, vacaciones) => {
  return vacaciones.some((v) => {
    const inicio = dayjs(v.fecha_inicio).startOf("day");
    const fin = dayjs(v.fecha_fin).endOf("day");
    const actual = dayjs(fecha).startOf("day");
    return actual.isAfter(inicio.subtract(1, "day")) && actual.isBefore(fin.add(1, "day"));
  });
};

// ---------------------------------------------------
// 6. Generar slots de 30 minutos
// ---------------------------------------------------
const generarSlots = (horaInicio, horaFin) => {
  const slots = [];
  let start = dayjs(horaInicio, "HH:mm");
  const end = dayjs(horaFin, "HH:mm");

  while (start.isBefore(end)) {
    slots.push(start.format("HH:mm"));
    start = start.add(30, "minute");
  }
  return slots;
};

// ---------------------------------------------------
// 7. Filtrar slots ocupados por citas existentes
// ---------------------------------------------------
const filtrarSlotsOcupados = (slots, citas) => {
  const ocupados = citas.map((c) => dayjs(c.fecha_hora).format("HH:mm"));
  return slots.filter((slot) => !ocupados.includes(slot));
};

// ---------------------------------------------------
// 8. Bloquear horas pasadas si es hoy
// ---------------------------------------------------
const filtrarHorasPasadas = (slots, fecha) => {
  const hoy = dayjs().format("YYYY-MM-DD");
  if (fecha !== hoy) return slots;

  const ahora = dayjs().format("HH:mm");
  return slots.filter((slot) => slot > ahora);
};

// ---------------------------------------------------
// 9. Fun principal: generar horarios disponibles
// ---------------------------------------------------
export const generarHorariosDisponibles = async (perfil_id, fechaISO) => {
  const diaSemana = dayjs(fechaISO).day(); // domingo = 0, lunes = 1...

  // Manejar domingo como 7 para coherencia con la BD si fuera necesario
  const diaSemanaBD = diaSemana === 0 ? 7 : diaSemana;

  const [horarios, vacaciones, citas] = await Promise.all([
    getHorariosMedico(perfil_id),
    getFechasSinAtencion(perfil_id),
    getCitasPorDia(perfil_id, fechaISO),
  ]);

  // 1. Vacaciones → NO hay atención
  if (estaEnVacaciones(fechaISO, vacaciones)) {
    return [];
  }

  // 2. Verificar si atiende ese día
  const horariosDelDia = horarios.filter((h) => h.dia_semana === diaSemanaBD);
  if (horariosDelDia.length === 0) {
    return [];
  }

  // 3. Generar todos los slots del día
  let allSlots = [];
  horariosDelDia.forEach((h) => {
    const slots = generarSlots(h.hora_inicio, h.hora_fin);
    allSlots = [...allSlots, ...slots];
  });

  // 4. Quitar slots ocupados por citas ya existentes
  allSlots = filtrarSlotsOcupados(allSlots, citas);

  // 5. Quitar horas pasadas si el día es hoy
  allSlots = filtrarHorasPasadas(allSlots, fechaISO);

  return allSlots;
};

// ---------------------------------------------------
// 10. Registrar una cita nueva
// ---------------------------------------------------
export const crearCita = async ({ medico_id,perfil_id, fechaISO, hora }) => {
  const fechaHora = `${fechaISO}T${hora}:00`;

  const { data, error } = await supabase.from("citas").insert([
    {
      medico_id,
      paciente_id: perfil_id,
      fecha_hora: fechaHora,
    },
  ]);

  if (error) throw error;
  return data;
};
