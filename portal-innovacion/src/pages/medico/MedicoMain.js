import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';

import { supabase } from "../../services/supabaseClient";
import {
  getCitasMedico,
  getCitaById
} from "../../services/citasService";

const Layout = () => {
  const [filtroPaciente, setFiltroPaciente] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [perfilId, setPerfilId] = useState(null);

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
        return "#b56b75";
      case "pendiente":
        return "#ddb6b8";
      case "cancelada":
        return "#e5c7c9";
      default:
        return "#d8a9b0";
    }
  };

  const handleEventClick = async (info) => {
    const cita = await getCitaById(info.event.id);

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

      // Fin = +30 min
      const dFin = new Date(dLocal.getTime() + 30 * 60000);
      finLocal = dFin.toLocaleTimeString("es-BO", {
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    setSelectedEvent({
      paciente: cita?.paciente_nombre ?? "Sin nombre",
      estado: cita?.estado ?? "Sin estado",
      inicio: `${fechaLocal} — ${horaLocal}`,
      fin: finLocal
    });

    setModalVisible(true);
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
      `}</style>
      <div className="container">
        <h1 style={{ marginBottom: "20px" }}>
          Calendario de Citas
        </h1>

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
        )}
      </div>
      {modalVisible && (
        <div style={{
          position:"fixed", top:0, left:0, width:"100%", height:"100%",
          background:"rgba(0,0,0,0.35)", display:"flex", justifyContent:"center",
          alignItems:"center", zIndex:9999
        }}>
          <div style={{
            background:"#fff", padding:"25px", borderRadius:"12px",
            width:"380px", boxShadow:"0 4px 15px rgba(0,0,0,0.2)"
          }}>
            <h3 style={{color:"#b56b75", marginBottom:"15px"}}>Detalle de la Cita</h3>
            <p><strong>Paciente:</strong><br />{selectedEvent?.paciente}</p>
            <p><strong>Estado:</strong><br />{selectedEvent?.estado}</p>
            <p><strong>Inicio:</strong><br />{selectedEvent?.inicio}</p>
            <p><strong>Fin:</strong><br />{selectedEvent?.fin}</p>
            <button
              onClick={() => setModalVisible(false)}
              style={{
                marginTop:"15px", background:"#b56b75", border:"none",
                padding:"8px 16px", color:"#fff", borderRadius:"8px",
                cursor:"pointer", width:"100%"
              }}
            >Cerrar</button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Layout;
