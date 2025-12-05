import React, { useState, useEffect } from 'react';
import {
  getMedicos,
  generarHorariosDisponibles,
  crearCita
} from '../../services/agendarCitaService';
import { supabase } from "../../services/supabaseClient";
import Breadcrumb from '../../components/Breadcrumb';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import Swal from 'sweetalert2';

const AgendarCita = () => {
  const [selectedMedico, setSelectedMedico] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');

  const [medicos, setMedicos] = useState([]);
  const [loadingMedicos, setLoadingMedicos] = useState(true);
  const [pacienteId, setPacienteId] = useState(null);
  const [citasPaciente, setCitasPaciente] = useState([]);
  // Obtener citas del paciente

  const [diasDisponibles, setDiasDisponibles] = useState([]);
  const [vacaciones, setVacaciones] = useState([]);
  const [loadingDisponibilidad, setLoadingDisponibilidad] = useState(false);
  const [activeTab, setActiveTab] = useState("agendar");

  // Obtener el paciente de la sesión
  const usuario = JSON.parse(localStorage.getItem("nb-user"));
  const email = usuario?.email;
  const [perfilId, setPerfilId] = useState(null);

   useEffect(() => {
    const obtenerPerfil = async () => {
      if (!email) return;
  
      const { data, error } = await supabase
        .from("perfil")
        .select("id")
        .eq("email", email)
        .single();
  
      if (!error && data?.id) {
        setPacienteId(data.id);
        console.log("Perfil encontrado:", data.id);
      } else {
        console.error("Error obteniendo perfil:", error);
      }
    };
  
    obtenerPerfil();
  }, [email]);
  

  // Cargar médicos reales
  useEffect(() => {
    const cargarMedicos = async () => {
      setLoadingMedicos(true);
      try {
        const data = await getMedicos();
        setMedicos(data);
      } catch (err) {
        console.error(err);
      }
      setLoadingMedicos(false);
    };
    cargarMedicos();
  }, []);

const handleMedicoChange = (e) => {
    setSelectedMedico(e.target.value);
    setSelectedDate(null);
    setAvailableTimes([]);
    setSelectedTime('');

    // Cargar disponibilidad real del médico
    const cargarDisponibilidad = async () => {
      setLoadingDisponibilidad(true);
      try {
        const { data: horariosData } = await supabase
          .from("horarios_medico")
          .select("dia_semana")
          .eq("perfil_id", e.target.value)
          .eq("activo", true);

        const { data: vacacionesData } = await supabase
          .from("fechas_sin_atencion")
          .select("fecha_inicio, fecha_fin")
          .eq("perfil_id", e.target.value);

        const dias = horariosData ? horariosData.map((h) => h.dia_semana) : [];
        console.log("Días disponibles cargados:", dias);
        console.log("Vacaciones cargadas:", vacacionesData);
        setDiasDisponibles(dias);
        setVacaciones(vacacionesData || []);
        setLoadingDisponibilidad(false);
      } catch (err) {
        console.error("Error cargando disponibilidad:", err);
        setDiasDisponibles([]);
        setVacaciones([]);
        setLoadingDisponibilidad(false);
      }
    };

    cargarDisponibilidad();
  };


const handleDateClick = async (info) => {
  console.log("Día seleccionado:", info.dateStr);

  const hoy = new Date();
  hoy.setHours(0,0,0,0);
  const fechaClick = new Date(info.dateStr + "T00:00:00");

  if (fechaClick < hoy) {
    Swal.fire({
      icon: "info",
      title: "Fecha no disponible",
      text: "No puede seleccionar un día anterior al de hoy.",
      confirmButtonColor: "#b56b75",
    });
    return;
  }

  const fechaSel = new Date(info.dateStr + "T00:00:00");
  const daySel = fechaSel.getDay();

  // Validación: día sin horarios
  if (diasDisponibles.length > 0 && !diasDisponibles.includes(daySel)) {
    Swal.fire({
      icon: "warning",
      title: "Día no disponible",
      text: "La médica no tiene horarios asignados para este día.",
      confirmButtonColor: "#b56b75",
    });
    return;
  }

  // Validación: vacaciones
  if (diaEnVacaciones(fechaSel)) {
    Swal.fire({
      icon: "warning",
      title: "No disponible",
      text: "La médica se encuentra de vacaciones en esta fecha.",
      confirmButtonColor: "#b56b75",
    });
    return;
  }

  if (!selectedMedico) {
    Swal.fire({
      icon: "info",
      title: "Seleccione una médica",
      text: "Debe elegir una especialista antes de seleccionar un día.",
      confirmButtonColor: "#b56b75",
    });
    return;
  }

  const fechaLocal = info.dateStr; // ← Aquí está la solución

  setSelectedDate(fechaLocal);
  setSelectedTime("");

  const { disponibilidad, motivo } =
    await generarHorariosDisponibles(selectedMedico, fechaLocal);

  if (motivo) {
    Swal.fire({
      icon: "warning",
      title: "No disponible",
      text: motivo,
      confirmButtonColor: "#b56b75",
    });
    setAvailableTimes([]);
    return;
  }

  setAvailableTimes(disponibilidad);
};

  const handleConfirmar = async () => {
    if (!pacienteId) {
      alert("No se pudo obtener el ID del paciente.");
      return;
    }
    try {
      await crearCita({
        medico_id: selectedMedico,
        paciente_id: pacienteId,
        fechaISO: selectedDate,
        hora: selectedTime
      });
      console.log("datos cita:", {
        medico_id: selectedMedico,
        paciente_id: pacienteId,
        fechaISO: selectedDate,
        hora: selectedTime
      });
      Swal.fire({
        icon: "success",
        title: "Cita registrada",
        text: "Tu cita ha sido programada exitosamente.",
        confirmButtonColor: "#b56b75",
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un problema al registrar la cita. Intente nuevamente.",
        confirmButtonColor: "#b56b75",
      });
    }
  };

  const isConfirmDisabled = !selectedMedico || !selectedDate || !selectedTime;

    useEffect(() => {
    const cargarCitasPaciente = async () => {
      if (!pacienteId) return;

      const { data, error } = await supabase
        .from("cita")
       .select(`
          id,
          fecha_hora,
          estado,
          medico_id,
          medico:perfil!cita_medico_id_fkey(nombre, apellidos)
        `)
        .eq("paciente_id", pacienteId)
        .order("fecha_hora", { ascending: true });

      if (!error) {
        const citasFormateadas = data.map((c) => ({
          ...c,
          medico_nombre: c.medico ? `${c.medico.nombre} ${c.medico.apellidos}` : "",
        }));
        setCitasPaciente(citasFormateadas);
        console.log("Citas del paciente cargadas:", citasFormateadas);
      }
    };
    cargarCitasPaciente();
  }, [pacienteId, activeTab]);
  // Cancelar cita
  const cancelarCita = async (idCita) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "¿Cancelar cita?",
      text: "Esta acción no se puede deshacer.",
      showCancelButton: true,
      confirmButtonColor: "#b56b75",
      cancelButtonColor: "#888",
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "Volver",
    });

    if (!confirm.isConfirmed) return;

    const { error } = await supabase
      .from("cita")
      .update({ estado: "cancelada" })
      .eq("id", idCita);

    if (!error) {
      setCitasPaciente((prev) =>
        prev.map((c) => (c.id === idCita ? { ...c, estado: "cancelada" } : c))
      );
      Swal.fire({
        icon: "success",
        title: "Cita cancelada",
        confirmButtonColor: "#b56b75",
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cancelar la cita.",
        confirmButtonColor: "#b56b75",
      });
    }
  };

  // Helper para marcar días de vacaciones
  const diaEnVacaciones = (date) => {
    return vacaciones.some((v) => {
      // Forzar interpretación LOCAL
      const inicio = new Date(`${v.fecha_inicio}T00:00:00`);
      const fin = new Date(`${v.fecha_fin}T23:59:59`);

      return date >= inicio && date <= fin;
    });
  };

  // Helper para mostrar la hora correcta (evita restar 4 horas del UTC)
  const formatearFechaHoraLocal = (isoString) => {
  if (!isoString) return "";
  const fechaUTC = new Date(isoString);

  if (Number.isNaN(fechaUTC.getTime())) return "";

  // Ajustar sumando offset
  const fechaLocal = new Date(
    fechaUTC.getTime() + fechaUTC.getTimezoneOffset() * 60000
  );

  const opcionesFecha = {
    weekday: "short", // ← LUN, MAR, etc.
    day: "2-digit",
    month: "short",
    year: "numeric",
  };

  const opcionesHora = {
    hour: "2-digit",
    minute: "2-digit",
  };

  const fecha = fechaLocal.toLocaleDateString("es-BO", opcionesFecha);
  const hora = fechaLocal.toLocaleTimeString("es-BO", opcionesHora);

  return `${fecha} – ${hora}`;
};

  return (
    <main>
      <Breadcrumb title="Agendar Cita" />

      {/* Tabs */}
      <div className="container pt-60">
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button
            onClick={() => setActiveTab("agendar")}
            style={{
              padding: "10px 20px",
              borderRadius: "999px",
              border: "1px solid #e0c8cb",
              background: activeTab === "agendar" ? "#b56b75" : "#fff",
              color: activeTab === "agendar" ? "#fff" : "#b56b75",
              transition: "0.3s",
            }}
          >
            Agendar Cita
          </button>
          <button
            onClick={() => setActiveTab("misCitas")}
            style={{
              padding: "10px 20px",
              borderRadius: "999px",
              border: "1px solid #e0c8cb",
              background: activeTab === "misCitas" ? "#b56b75" : "#fff",
              color: activeTab === "misCitas" ? "#fff" : "#b56b75",
              transition: "0.3s",
            }}
          >
            Mis Citas
          </button>
        </div>
      </div>

      {activeTab === "agendar" && (
        <section className="pb-80" style={{ background: '#FFF7F7', animation: "fadeIn 0.4s ease" }}>
          <div className="container">
            <div
              className="p-4 p-lg-5"
              style={{
                background: '#ffffff',
                borderRadius: '18px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
              }}
            >
              {/* Encabezado */}
              <div className="row mb-4 mb-lg-5">
                <div className="col-12 col-lg-8">
                  <h2
                    style={{
                      fontSize: '32px',
                      fontWeight: 700,
                      color: '#b56b75',
                      marginBottom: '8px',
                    }}
                  >
                    Reserva tu cita ginecológica
                  </h2>
                  <p style={{ maxWidth: '640px', color: '#6f6f6f', lineHeight: 1.6 }}>
                    Elige primero a la especialista, luego un día en el calendario y finalmente
                    uno de los horarios disponibles de 30 minutos. Te confirmaremos la reserva
                    por correo electrónico.
                  </p>
                </div>
              </div>

              <div className="row g-4">
                {/* Panel izquierdo: médico + horarios */}
                <div className="col-lg-4">
                  <div
                    style={{
                      background: '#fff7f8',
                      borderRadius: '16px',
                      border: '1px solid #f0dde0',
                      padding: '20px 20px 22px',
                      height: '100%',
                    }}
                  >
                    <h5
                      style={{
                        fontWeight: 600,
                        color: '#b56b75',
                        marginBottom: '14px',
                      }}
                    >
                      1. Seleccione a la médica
                    </h5>

                    <div className="mb-3">
                      <select
                        className="form-select"
                        value={selectedMedico}
                        onChange={handleMedicoChange}
                        style={{
                          borderRadius: '999px',
                          padding: '10px 16px',
                          borderColor: '#e0c8cb',
                        }}
                      >
                        <option value="">Elija una opción...</option>
                        {loadingMedicos ? (
                          <option>Cargando médicos...</option>
                        ) : (
                          medicos.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.nombre_completo} — {m.especialidad}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <hr style={{ borderColor: '#f0dde0', margin: '18px 0' }} />

                    <h5
                      style={{
                        fontWeight: 600,
                        color: '#b56b75',
                        marginBottom: '8px',
                      }}
                    >
                      2. Horarios disponibles
                    </h5>

                    <p
                      style={{
                        fontSize: '13px',
                        color: '#8b7b7b',
                        marginBottom: '10px',
                      }}
                    >
                      {selectedDate
                        ? (() => {
                            const [año, mes, dia] = selectedDate.split("-");
                            const fechaLocal = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));

                            return `Para el día ${fechaLocal.toLocaleDateString("es-BO", {
                              day: "2-digit",
                              month: "long",
                            })}`;
                          })()
                        : "Seleccione primero una fecha en el calendario."}
                    </p>

                    {availableTimes.length === 0 ? (
                      <div
                        style={{
                          fontSize: '13px',
                          color: '#a08f8f',
                          background: '#fff',
                          borderRadius: '12px',
                          border: '1px dashed #e3cfd2',
                          padding: '14px 12px',
                        }}
                      >
                        No hay horarios cargados. Elija una fecha disponible del calendario para
                        ver las horas sugeridas.
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '8px',
                          marginTop: '4px',
                        }}
                      >
                        {availableTimes.map((hora) => (
                          <button
                            key={hora}
                            type="button"
                            onClick={() => setSelectedTime(hora)}
                            style={{
                              padding: '7px 14px',
                              borderRadius: '999px',
                              border:
                                selectedTime === hora
                                  ? '1px solid #b56b75'
                                  : '1px solid #e0c8cb',
                              background:
                                selectedTime === hora ? '#b56b75' : 'rgba(255,255,255,0.9)',
                              color: selectedTime === hora ? '#fff' : '#7b6467',
                              fontSize: '13px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {hora}
                          </button>
                        ))}
                      </div>
                    )}

                    <div style={{ marginTop: '22px' }}>
                      <button
                        type="button"
                        className="ed-btn-theme"
                        onClick={handleConfirmar}
                        disabled={isConfirmDisabled}
                        style={{
                          opacity: isConfirmDisabled ? 0.6 : 1,
                          cursor: isConfirmDisabled ? 'not-allowed' : 'pointer',
                          width: '100%',
                          justifyContent: 'center',
                        }}
                      >
                        Confirmar cita
                      </button>
                    </div>
                  </div>
                </div>

                {/* Panel derecho: calendario */}
                <div className="col-lg-8">
                  <div
                    style={{
                      background: '#fff7f8',
                      borderRadius: '16px',
                      border: '1px solid #f0dde0',
                      padding: '20px 18px 10px',
                    }}
                  >
                    <h5
                      style={{
                        fontWeight: 600,
                        color: '#b56b75',
                        marginBottom: '12px',
                        paddingLeft: '4px',
                      }}
                    >
                      3. Seleccione el día en el calendario
                    </h5>

                    {loadingDisponibilidad ? (
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div className="spinner-border text-danger" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                        <p style={{ marginTop: '12px', color: '#b56b75', fontWeight: 500 }}>Cargando disponibilidad...</p>
                      </div>
                    ) : (
                      <FullCalendar
                        plugins={[dayGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        locale={esLocale}
                        height="auto"
                        selectable={true}
                        dateClick={handleDateClick}
                        headerToolbar={{
                          left: 'prev,next today',
                          center: 'title',
                          right: '',
                        }}
                        dayMaxEventRows={2}
                        fixedWeekCount={false}
                        dayCellClassNames={(args) => {
                          const date = args.date;
                          const hoy = new Date();
                          hoy.setHours(0,0,0,0);
                          const classes = [];
                          if (date < hoy) {
                            classes.push("fc-dia-no-disponible");
                          }
                          const day = date.getDay();
                          if (diasDisponibles.length > 0 && !diasDisponibles.includes(day)) {
                            classes.push("fc-dia-no-disponible");
                          }
                          if (diaEnVacaciones(date)) {
                            classes.push("fc-dia-no-disponible");
                          }
                          return classes;
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === "misCitas" && (
        <section className="pb-80" style={{ background: '#FFF7F7', animation: "fadeIn 0.4s ease" }}>
          <div className="container">
            <div
              className="p-4 p-lg-5"
              style={{
                background: '#ffffff',
                borderRadius: '18px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
              }}
            >
              <h3 style={{ color: '#b56b75', fontWeight: 700, marginBottom: '20px' }}>
                Mis citas programadas
              </h3>

              {citasPaciente && citasPaciente.length > 0 ? (
                <div className="table-responsive">
                  <table className="nb-table">
                    <thead>
                      <tr>
                        <th>Fecha y hora</th>
                        <th>Médica</th>
                        <th>Estado</th>
                        <th></th>
                      </tr>
                    </thead>

                    <tbody>
                      {citasPaciente.map((cita) => (
                        <tr key={cita.id}>
                          <td className="nb-td-strong">
                            {formatearFechaHoraLocal(cita.fecha_hora)}
                          </td>

                          <td>{cita.medico_nombre || "Sin nombre"}</td>

                          <td>
                            <span
                              className={`nb-badge ${
                                cita.estado === "cancelada"
                                  ? "nb-badge-cancelada"
                                  : "nb-badge-activa"
                              }`}
                            >
                              {cita.estado}
                            </span>
                          </td>

                          <td className="text-end">
                            {cita.estado !== "cancelada" && (
                              <button
                                className="nb-btn-cancelar"
                                onClick={() => cancelarCita(cita.id)}
                              >
                                Cancelar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: '#8b7b7b' }}>No tiene citas programadas.</p>
              )}
            </div>
          </div>
        </section>
      )}
      <style>
      {`
        .fc-dia-no-disponible {
          background-color: #f1e2e2 !important;
          opacity: 0.45 !important;
          cursor: not-allowed !important;
        }
        .fc-dia-no-disponible .fc-daygrid-day-frame {
          pointer-events: none !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .nb-table {
          width: 100%;
          border-collapse: collapse;
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 6px 18px rgba(0,0,0,0.06);
        }

        .nb-table thead {
          background: linear-gradient(90deg, #d79aa4, #b56b75);
          color: #fff;
        }

        .nb-table th {
          padding: 14px 20px;
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 0.3px;
        }

        .nb-table td {
          padding: 16px 20px;
          color: #6a5f5f;
          border-bottom: 1px solid #f3e7e9;
        }

        .nb-td-strong {
          font-weight: 600;
          color: #b56b75;
        }

        .nb-table tr:last-child td {
          border-bottom: none;
        }

        .nb-badge {
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .nb-badge-activa {
          background: #e8f8f1;
          color: #3a8f6f;
          border: 1px solid #c8e9db;
        }

        .nb-badge-cancelada {
          background: #fdeaea;
          color: #d96a6a;
          border: 1px solid #f3c8c8;
        }

        .nb-btn-cancelar {
          background: #fff;
          border: 1px solid #d8a3a8;
          color: #b56b75;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 13px;
          transition: 0.2s ease;
        }

        .nb-btn-cancelar:hover {
          background: #b56b75;
          color: white;
        }
      `}
      </style>
    </main>
  );
};

export default AgendarCita;
