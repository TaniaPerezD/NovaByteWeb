import React, { useState, useEffect } from 'react';
import Swal from "sweetalert2";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';
import { FaFilePdf } from 'react-icons/fa';
import AgendaMedicoModal from '../reportes/AgendaMedicoModal';

import { supabase } from "../../services/supabaseClient";
import {
  getCitasMedico,
  getCitaById,
  crearConsulta,
  crearArchivoClinico
} from "../../services/citasService";
import { actualizarEstadoCita } from "../../services/citasService";
import { notificarCitaCompletada } from "../../services/authService";

const Layout = () => {
  const [filtroPaciente, setFiltroPaciente] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalAnim, setModalAnim] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [perfilId, setPerfilId] = useState(null);
  const [agendaMedicoModalOpen, setAgendaMedicoModalOpen] = useState(false);

  const usuario = JSON.parse(localStorage.getItem("nb-user"));
  const email = usuario?.email;

  useEffect(() => {
      const medicoEmail = email;
    if (!medicoEmail) return;

    const fetchPerfil = async () => {
      const { data, error } = await supabase
        .from("perfil")
        .select("id")
        .eq("email", medicoEmail)
        .single();
      if (!error && data) setPerfilId(data.id);
      console.log("Perfil encontrado:", data.id);
    };

    fetchPerfil();
  }, []);

  useEffect(() => {
    if (!perfilId) return;

    const cargarCitas = async () => {
      setLoading(true);
      const data = await getCitasMedico(perfilId);

      if (data) {
        const transformadas = data.map(c => {
          // ejemplo: "2025-12-09T09:00:00+00:00"
          const fechaISO = c.fecha_hora;

          if (!fechaISO) {
            console.warn("Cita sin fecha_hora:", c);
            return null;
          }

          const [fecha, horaCompleta] = fechaISO.split("T");
          const hora = horaCompleta.substring(0,5); // "09:00"

          return {
            id: c.id,
            title: `${c.paciente_nombre ?? "Paciente sin nombre"} — ${c.estado ?? "sin estado"}`,
            start: `${fecha}T${hora}`,
            end: calcularFin(fecha, hora),
            color: obtenerColorEstado(c.estado)
          };
        }).filter(Boolean);
        setCitas(transformadas);

      }
      setLoading(false);
    };

    cargarCitas();
  }, [perfilId]);

const calcularFin = (fecha, hora) => {
  if (!fecha || !hora) {
    console.warn("⚠️ Fecha u hora inválida:", { fecha, hora });
    return null; // evita el crash
  }

  const inicio = new Date(`${fecha}T${hora}`);

  if (isNaN(inicio.getTime())) {
    console.warn("⚠️ Fecha/hora no se pudo convertir en Date:", { fecha, hora });
    return null;
  }

  const fin = new Date(inicio.getTime() + 30 * 60000);
  return fin.toISOString();
};

  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case "confirmada":
        return "#8bc34a";
      case "programada":
        return "#b56b75";
      case "pendiente":
        return "#ffb74d";
      case "cancelada":
        return "#e57373";
      default:
        return "#d8a9b0";
    }
  };

const handleEventClick = async (info) => {
  const cita = await getCitaById(info.event.id);
  const pacienteNombre = cita?.paciente_nombre ?? (cita?.perfil_paciente ? cita.perfil_paciente.nombre + " " + cita.perfil_paciente.apellidos : "Sin nombre");
  console.log("DEBUG CITA →", cita);

  const consultaExistente = cita?.consulta ?? null;

  if (!cita.paciente_id || !cita.medico_id) {
    console.error("Cita incompleta:", cita);
    return;
  }

  // PROTECCIÓN en caso de cita null
  if (!cita) {
    console.error("❌ No se encontró la cita en Supabase");
    return;
  }

  const iso = cita?.fecha_hora;
  let fechaLocal = "";
  let horaLocal = "";
  let finLocal = "";

  if (iso) {
    const d = new Date(iso);
    const dLocal = new Date(d.getTime() + d.getTimezoneOffset() * 60000);

    fechaLocal = dLocal.toLocaleDateString("es-BO", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    });

    horaLocal = dLocal.toLocaleTimeString("es-BO", {
      hour: "2-digit",
      minute: "2-digit"
    });

    const dFin = new Date(dLocal.getTime() + 30 * 60000);

    finLocal = dFin.toLocaleTimeString("es-BO", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  // Cargar archivos clínicos del paciente
  const cargarArchivos = async () => {
    const { data, error } = await supabase
      .from("archivo_clinico")
      .select("*")
      .eq("paciente_id", cita.paciente_id);

    setSelectedEvent(prev => ({
      ...prev,
      archivosClinicos: data || [],
      archivosClinicosCargados: true
    }));
  };

  cargarArchivos();
  // Solo preparar el modal, sin crear consulta
  setSelectedEvent({
    cita: cita,
    paciente: pacienteNombre,
    estado: cita?.estado ?? "Sin estado",
    inicio: `${fechaLocal} — ${horaLocal}`,
    fin: finLocal,
    archivoSeleccionado: null,
    archivosClinicos: [],
    archivosClinicosCargados: false,
    consultaCreada: consultaExistente,
  });
  console.log("CITA SELECCIONADA:", cita);
  console.log("CONSULTA EXISTENTE:", consultaExistente);

  setModalVisible(true);
  setTimeout(() => setModalAnim(true), 10);
};

  return (
    <main>
      <style>{`
        .fc .fc-toolbar-title {
          font-size: 1.8rem;
          color: #b56b75;
          font-weight: bold;
        }
        .fc .fc-button {
          background-color: #f4dcdc !important;
          border: none !important;
          color: #5a3e3e !important;
          border-radius: 8px !important;
          padding: 6px 14px !important;
          font-weight: 500 !important;
          transition: 0.2s ease;
        }
        .fc .fc-button-active,
        .fc .fc-button:hover {
          background-color: #eac4c4 !important;
        }
        .fc .fc-col-header-cell-cushion {
          color: #7a5c5c;
          font-weight: 600;
          padding: 12px 0;
          font-size: 1rem;
        }
        .fc .fc-daygrid-day,
        .fc .fc-timegrid-slot,
        .fc .fc-timegrid,
        .fc .fc-view-harness,
        .fc .fc-scrollgrid,
        .fc .fc-scrollgrid-section,
        .fc .fc-scrollgrid-sync-table {
          background-color: #ffffff !important;
        }
        .fc {
          background: #ffffff !important;
        }
        .fc .fc-daygrid-day.fc-day-today {
          background-color: #f1d0d0ff !important;
          border: 1px solid #e6bcbc !important;
        }
        .fc-event {
          background-color: #d8a9b0 !important;
          border: none !important;
          border-radius: 6px !important;
          padding: 2px 6px !important;
        }
        .fc-event-title {
          font-size: 0.8rem !important;
          color: #5a3e3e !important;
        }
        .modal-divider {
          margin: 18px 0;
          height: 1px;
          background: #e5c8c8;
          border-radius: 1px;
        }

        .modal-subtitle {
          color: #a25a66;
          font-weight: 600;
          font-size: 1.1rem;
          margin-bottom: 8px;
        }
        .btn-generar-agenda {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background-color: #b56b75;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
          font-size: 0.95rem;
        }
        .btn-generar-agenda:hover {
          background-color: #a25a66;
        }
        .header-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
      `}</style>
      <style>{`
        .modal-backdrop {
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: rgba(0,0,0,0.35);
          display: flex; justify-content: center; align-items: center;
          z-index: 9999;
        }
        .modal-view-wrapper {
          opacity: 0;
          transform: translateY(20px);
          transition: 0.25s ease;
          display: flex; justify-content: center; align-items: center;
          width: 100%;
        }
        .modal-view-wrapper.show {
          opacity: 1;
          transform: translateY(0);
        }
        .modal-section-card {
          background: #fff;
          padding: 25px;
          border-radius: 14px;
          width: 400px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.18);
          animation: fadeScale 0.25s ease;
        }
        @keyframes fadeScale {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-title {
          color: #b56b75;
          font-size: 1.4rem;
          font-weight: 600;
          margin-bottom: 18px;
          text-align: center;
        }
        .modal-field {
          margin-bottom: 12px;
        }
        .modal-label {
          font-weight: 600;
          color: #6d4b4b;
        }
        .modal-value {
          margin: 4px 0 0;
          color: #3f2f2f;
          font-size: 0.95rem;
        }
        .modal-close-btn {
          width: 100%;
          margin-top: 18px;
          background: #b56b75;
          border: none;
          color: #fff;
          padding: 10px;
          border-radius: 10px;
          font-size: 1rem;
          cursor: pointer;
          transition: 0.2s ease;
        }
        .modal-close-btn:hover {
          background: #a25a66;
        }
      `}</style>
      <div className="container">
        <div className="header-actions">
          <h1>Calendario de Citas</h1>
          <button 
            className="btn-generar-agenda"
            onClick={() => setAgendaMedicoModalOpen(true)}
          >
            <FaFilePdf /> Generar Agenda PDF
          </button>
        </div>

        {/* FILTROS */}
        <div style={{
          display: "flex",
          gap: "20px",
          marginBottom: "20px",
          alignItems: "center"
        }}>
          <input
            type="text"
            placeholder="Buscar por paciente..."
            className="form-control"
            value={filtroPaciente}
            onChange={(e) => setFiltroPaciente(e.target.value)}
            style={{ maxWidth: "250px" }}
          />

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="form-control"
            style={{ maxWidth: "200px" }}
          >
            <option value="">Todos los estados</option>
            <option value="confirmada">Confirmada</option>
            <option value="pendiente">Pendiente</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        {loading && (
          <div style={{ textAlign: "center", margin: "20px 0" }}>
            <span className="spinner-border" style={{ color:"#b56b75" }}></span>
            <p>Cargando citas...</p>
          </div>
        )}
        {!loading && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
              marginBottom: "25px",
            }}
          >
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek"
              }}
              locale={esLocale}
              allDayText="Todo el día"
              noEventsText="No hay eventos para mostrar"
              buttonText={{
                today: 'Hoy',
                month: 'Mes',
                week: 'Semana',
                day: 'Día',
                list: 'Agenda'
              }}
              events={citas.filter(ev => {
                const matchPaciente = ev.title.toLowerCase().includes(filtroPaciente.toLowerCase());
                const matchEstado = filtroEstado === "" || ev.title.toLowerCase().includes(filtroEstado.toLowerCase());
                return matchPaciente && matchEstado;
              })}
              height="80vh"
              slotMinTime="08:00:00"
              slotMaxTime="20:00:00"
              nowIndicator={true}
              selectable={false}
              editable={false}
              contentHeight="auto"
              expandRows={true}
              eventClick={handleEventClick}
            />
          </div>
        )}
      </div>

      {modalVisible && (
  <div className="modal-backdrop fade-in">
    <div className={`modal-view-wrapper ${modalAnim ? "show" : ""}`}>
      <div className="modal-section-card">

        <h3 className="modal-title">Gestionar Consulta</h3>

        {/* Datos principales de la cita */}
        <div className="modal-field">
          <span className="modal-label">Paciente:</span>
          <p className="modal-value">
            {selectedEvent?.cita?.paciente_nombre ?? selectedEvent?.paciente ?? "Sin nombre"}
          </p>
        </div>

        <div className="modal-field">
          <span className="modal-label">Fecha y Hora:</span>
          <p className="modal-value">
            {new Date(selectedEvent?.cita?.fecha_hora).toLocaleString("es-BO")}
          </p>
        </div>

        {/* Badge visual para el estado */}
        <div className="modal-field">
          <span className="modal-label">Estado:</span>
          <span
            style={{
              display: "inline-block",
              marginLeft: "8px",
              padding: "4px 10px",
              borderRadius: "12px",
              fontSize: "0.85rem",
              fontWeight: "600",
              color: "#fff",
              backgroundColor:
                selectedEvent?.cita?.estado === "completada"
                  ? "#4caf50"
                  : selectedEvent?.cita?.estado === "cancelada"
                  ? "#e57373"
                  : selectedEvent?.cita?.estado === "no_asistio"
                  ? "#9e9e9e"
                  : "#ffb74d"
            }}
          >
            {selectedEvent?.cita?.estado ?? "programada"}
          </span>
        </div>

        {/* Botón para marcar como completada */}
        {selectedEvent?.cita?.estado !== "completada" && (
          <button
            className="modal-close-btn"
            style={{ marginTop: "12px", background: "#4caf50" }}
            onClick={async () => {
              const modalContainer = document.querySelector(".modal-section-card");
              const result = await Swal.fire({
                target: modalContainer,
                title: "¿Marcar cita como completada?",
                text: "Esta acción no se puede deshacer.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#4caf50",
                cancelButtonColor: "#b56b75",
                confirmButtonText: "Sí, completar",
                cancelButtonText: "Cancelar",
                backdrop: false,
                position: "center"
              });

              if (!result.isConfirmed) return;

              await actualizarEstadoCita(
                selectedEvent.cita.id,
                "completada"
              );
              // Enviar correo al paciente (best-effort, sin romper UX)
              notificarCitaCompletada({
                cita_id: selectedEvent.cita.id,
                paciente_id: selectedEvent.cita.paciente_id,
              });

              await Swal.fire({
                target: modalContainer,
                title: "Cita completada",
                text: "La cita fue marcada como completada correctamente.",
                icon: "success",
                timer: 1200,
                showConfirmButton: false,
                backdrop: false
              });

              // Actualizar cita en el calendario (sin recargar)
              setCitas(prev =>
                prev.map(ev =>
                  ev.id === selectedEvent.cita.id
                    ? {
                        ...ev,
                        title: `${selectedEvent.paciente} — completada`,
                        color: obtenerColorEstado("completada")
                      }
                    : ev
                )
              );

              // Actualizar estado en el modal
              setSelectedEvent(prev => ({
                ...prev,
                cita: {
                  ...prev.cita,
                  estado: "completada"
                }
              }));

              setModalAnim(false);
              setTimeout(() => {
                setModalVisible(false);
              }, 200);
            }}
          >
            Marcar cita como completada
          </button>
        )}

        <div className="modal-divider" />

        {/* SECCIÓN ARCHIVO CLÍNICO */}
        <h4 className="modal-subtitle">Archivo Clínico</h4>

        {selectedEvent?.cita?.estado === "cancelada" ? (
          <>
            <p className="modal-value" style={{ color: "#b55656", fontWeight: "600" }}>
              Esta cita está cancelada. No se puede asignar consulta ni archivo clínico.
            </p>
          </>
        ) : selectedEvent?.consultaCreada ? (
          <>
            <p className="modal-value">
              Esta cita ya cuenta con una consulta generada.
            </p>

            <div className="modal-field">
              <span className="modal-label">ID Consulta:</span>
              <p className="modal-value">
                {selectedEvent?.consultaCreada?.motivo  ?? selectedEvent?.consultaCreada?.id}
              </p>
            </div>

            <div className="modal-field">
              <span className="modal-label">Archivo Clínico asignado:</span>
              <p className="modal-value">
                {selectedEvent?.consultaCreada?.archivo?.tipo
                  ??  "Sin archivo asignado"}
              </p>
            </div>
          </>
        ) : (
          <>
            {!selectedEvent?.archivosClinicosCargados && (
              <p className="modal-value">Cargando archivos clínicos...</p>
            )}

            {selectedEvent?.archivosClinicosCargados && (
              <>
                {selectedEvent?.archivosClinicos?.length === 0 ? (
                  <p className="modal-value">No hay archivos clínicos aún.</p>
                ) : (
                  <div className="modal-field">
                    <span className="modal-label">Seleccionar archivo:</span>
                    <select
                      className="form-control"
                      value={selectedEvent?.archivoSeleccionado || ""}
                      onChange={(e) => {
                        setSelectedEvent(prev => ({
                          ...prev,
                          archivoSeleccionado: e.target.value
                        }));
                      }}
                    >
                      <option value="">-- Seleccionar --</option>
                      {selectedEvent.archivosClinicos.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.nombre ?? `Archivo #${a.id.slice(0, 8)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            <button
              className="modal-close-btn"
              style={{ background: "#8b6a9e", marginTop: "15px" }}
              onClick={async () => {
                const nuevo = await crearArchivoClinico(selectedEvent?.cita?.paciente_id);
                if (!nuevo) return;

                setSelectedEvent(prev => ({
                  ...prev,
                  archivoSeleccionado: nuevo.id,
                  archivosClinicos: [...prev.archivosClinicos, nuevo]
                }));
              }}
            >
              Crear archivo clínico nuevo
            </button>

            <div className="modal-divider" />

            <button
              className="modal-close-btn"
              disabled={!selectedEvent?.archivoSeleccionado}
              onClick={async () => {
                const consulta = await crearConsulta(
                  selectedEvent?.cita,
                  selectedEvent?.archivoSeleccionado
                );
                if (!consulta) return;

                setSelectedEvent(prev => ({
                  ...prev,
                  consultaCreada: consulta,
                  modoSoloLectura: true
                }));
              }}
            >
              Crear Consulta
            </button>
          </>
        )}

        {/* Mostrar consulta creada */}
        {selectedEvent?.consultaCreada && (
          <>
            <div className="modal-divider" />
            <h4 className="modal-subtitle">Consulta Creada</h4>
            <p className="modal-value">
              {selectedEvent.consultaCreada.motivo ?? selectedEvent.consultaCreada.id}
            </p>
          </>
        )}

        <button
          className="modal-close-btn"
          style={{ marginTop: "22px" }}
          onClick={() => {
            setModalAnim(false);
            setTimeout(() => setModalVisible(false), 150);
          }}
        >
          Cerrar
        </button>

      </div>
    </div>
  </div>
)}
    <AgendaMedicoModal
        isOpen={agendaMedicoModalOpen}
        onClose={() => setAgendaMedicoModalOpen(false)}
        medicoId={perfilId}
      />
 
    </main>
  );
};

export default Layout;
