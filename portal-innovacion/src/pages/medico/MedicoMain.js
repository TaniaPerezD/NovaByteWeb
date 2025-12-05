import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';

const Layout = () => {
  const [filtroPaciente, setFiltroPaciente] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const eventosPrueba = [
    {
      id: '1',
      title: 'Cita — María Pérez (confirmada)',
      start: '2025-12-06T09:00:00',
      end: '2025-12-06T10:00:00',
      color: '#b56b75'
    },
    {
      id: '2',
      title: 'Cita — Ana López (pendiente)',
      start: '2025-12-07T11:00:00',
      end: '2025-12-07T12:00:00',
      color: '#ddb6b8'
    },
    {
      id: '3',
      title: 'Cita — Carla Gutiérrez (cancelada)',
      start: '2025-12-08T14:00:00',
      end: '2025-12-08T15:00:00',
      color: '#e5c7c9'
    }
  ];

  const handleEventClick = (info) => {
    setSelectedEvent({
      title: info.event.title,
      start: info.event.start.toLocaleString(),
      end: info.event.end.toLocaleString()
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
        .fc .fc-daygrid-day {
          background: #fdf4f4;
        }
        .fc .fc-daygrid-day.fc-day-today {
          background-color: #fff1f1 !important;
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
          events={eventosPrueba.filter(ev => {
            const coincidePaciente = ev.title.toLowerCase().includes(filtroPaciente.toLowerCase());
            const coincideEstado = filtroEstado === "" || ev.title.toLowerCase().includes(filtroEstado.toLowerCase());
            return coincidePaciente && coincideEstado;
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
            <p><strong>Paciente:</strong><br/>{selectedEvent?.title}</p>
            <p><strong>Inicio:</strong><br/>{selectedEvent?.start}</p>
            <p><strong>Fin:</strong><br/>{selectedEvent?.end}</p>
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
