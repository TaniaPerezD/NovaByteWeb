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
import esLocale from '@fullcalendar/core/locales/es';

const AgendarCita = () => {
  const [selectedMedico, setSelectedMedico] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');

  const [medicos, setMedicos] = useState([]);
  const [loadingMedicos, setLoadingMedicos] = useState(true);
  const [pacienteId, setPacienteId] = useState(null);

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
  };

  const handleDateClick = (info) => {
    if (!selectedMedico) {
      // Simple aviso visual; luego se podría usar Swal
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSelectedDate(info.dateStr);
    setSelectedTime('');
    generarHorariosDisponibles(selectedMedico, info.dateStr)
      .then(setAvailableTimes)
      .catch(console.error);
  };

  const handleConfirmar = async () => {
    if (!pacienteId) {
      alert("No se pudo obtener el ID del paciente.");
      return;
    }
    try {
      await crearCita({
        perfil_id: selectedMedico,
        paciente_id: pacienteId,
        fechaISO: selectedDate,
        hora: selectedTime
      });
      alert("Cita registrada exitosamente.");
    } catch (err) {
      console.error(err);
      alert("Error registrando la cita.");
    }
  };

  const isConfirmDisabled = !selectedMedico || !selectedDate || !selectedTime;

  return (
    <main>
      <Breadcrumb title="Agendar Cita" />

      <section className="pt-120 pb-120" style={{ background: '#FFF7F7' }}>
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
                      ? `Para el día ${new Date(selectedDate).toLocaleDateString('es-BO', {
                          day: '2-digit',
                          month: 'long',
                        })}`
                      : 'Seleccione primero una fecha en el calendario.'}
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

                  <FullCalendar
                    plugins={[dayGridPlugin]}
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
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AgendarCita;
