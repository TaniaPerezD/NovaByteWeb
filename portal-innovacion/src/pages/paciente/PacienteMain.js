import React from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import Event from '../home/EventSection'; // mismo componente que usan en home

const PacienteMain = () => {
  // simulación de datos recibidos desde el back
  const paciente = {
    nombre: 'Adriana',
    proximaCita: '31/10/2025',
    ultimoDiagnostico: '28/10/2025',
    recomendacion: 'Autoexploración',
  };

  const acciones = [
    {
      id: 1,
      titulo: 'Agendar nueva cita',
      descripcionBoton: 'Agendar cita',
      fecha: '12 Noviembre',
      imagen: require('../../assets/img/event/event2.jpg'),
    },
    {
      id: 2,
      titulo: 'Ver historial médico',
      descripcionBoton: 'Ver historial médico',
      fecha: '12 Noviembre',
      imagen: require('../../assets/img/event/event2.jpg'),
    },
    {
      id: 3,
      titulo: 'Recomendación del día o recordatorio de autoexploración',
      descripcionBoton: 'Realizar Autoexploración',
      fecha: '05 Octubre',
      imagen: require('../../assets/img/event/event1.jpg'),
    },
  ];

  return (
    <main style={{ background: '#F8EAE7', minHeight: '100vh' }}>
      {/* unified background for breadcrumb and greeting */}
      <div style={{ backgroundColor: '#FCECEC' }}>
        {/* encabezado igual mockup */}
        <Breadcrumb title="Bienvenida Adriana" subtitle="Página Principal / Paciente" />

        {/* barra saludo */}
        
      </div>

      <div className="container" style={{ maxWidth: '1100px' }}>
        <div
          style={{
            background: 'linear-gradient(90deg, #D78584 0%, #F6B364 100%)',
            borderRadius: '16px',
            padding: '18px 28px',
            marginTop: '26px',
            marginBottom: '16px',
            textAlign: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '22px',
            maxWidth: '1100px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Hola, {paciente.nombre}! Nos alegra verte de nuevo
        </div>
        {/* 3 tarjetas superiores */}
        <div className="d-flex gap-4 justify-content-between" style={{ display: 'flex', gap: '28px', justifyContent: 'center', marginBottom: '30px' }}>
          {acciones.map((item) => (
            <div
              key={item.id}
              style={{
                background: '#D78584',
                borderRadius: '18px',
                padding: '26px 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                flex: '1 1 0',
                maxWidth: '350px',
              }}
            >
              <span style={{ color: '#FFFFFF', fontWeight: 500, fontSize: '16px' }}>
                {item.id === 1
                  ? 'Próxima cita'
                  : item.id === 2
                  ? 'Último Diagnóstico'
                  : 'Recomendación del día'}
              </span>
              <span style={{ color: '#0F172A', fontWeight: 700, fontSize: item.id === 3 ? '24px' : '26px' }}>
                {item.id === 1
                  ? paciente.proximaCita
                  : item.id === 2
                  ? paciente.ultimoDiagnostico
                  : paciente.recomendacion}
              </span>
            </div>
          ))}
        </div>

        {/* tarjetas con imagen como en home */}
        <div className="d-flex gap-4 justify-content-between" style={{ display: 'flex', gap: '28px', justifyContent: 'center', marginBottom: '30px' }}>
          {acciones.map((item) => (
            <div
              key={item.id}
              style={{
                background: '#F5CECE',
                borderRadius: '18px',
                overflow: 'hidden',
                boxShadow: '0 10px 25px rgba(216,135,135,0.20)',
                flex: '1 1 0',
                maxWidth: '350px',
              }}
            >
              {/* imagen */}
              <div style={{ position: 'relative' }}>
                <img src={item.imagen} alt={item.titulo} style={{ width: '100%', height: '190px', objectFit: 'cover' }} />
                <span
                  style={{
                    position: 'absolute',
                    top: '14px',
                    right: '14px',
                    background: '#D48F8F',
                    color: '#fff',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    textAlign: 'right',
                    lineHeight: 1.1,
                  }}
                >
                  {item.fecha.split(' ')[0]}
                  <br />
                  {item.fecha.split(' ')[1]}
                </span>
              </div>
              {/* contenido */}
              <div style={{ padding: '18px 20px 22px 20px', textAlign: 'center' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', marginBottom: '16px' }}>
                  {item.titulo}
                </h4>
                <button
                  type="button"
                  style={{
                    background: '#E09A9A',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '10px 26px',
                    color: '#fff',
                    fontWeight: 500,
                    fontSize: '14px',
                  }}
                >
                  {item.descripcionBoton}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default PacienteMain;
