import React from 'react';
import Breadcrumb from '../../components/Breadcrumb';

const MedicoMain = () => {
  // simulación de datos que llegarían del back
  const datosResumen = {
    citasHoy: 15,
    pacientesAtendidos: 5,
    citasPendientes: 10,
    nivelSatisfaccion: 8,
  };

  const citasDelDia = {
    fechaLarga: 'VIERNES 31 DE OCTUBRE',
    listado: [
      {
        hora: '09:00',
        paciente: 'Ana Maria Mercado Galarza',
        estado: 'Confirmada',
        color: '#3CB371', // verde
      },
      {
        hora: '09:00',
        paciente: 'Adriana Nathalie Rocha Vedia',
        estado: 'En curso',
        color: '#F1C84B', // amarillo
      },
      {
        hora: '09:00',
        paciente: 'Ivonne Micaela Colque Murillo',
        estado: 'Confirmada',
        color: '#3CB371',
      },
      {
        hora: '09:00',
        paciente: 'Isabel Antonella Rocha Vedia',
        estado: 'Cancelada',
        color: '#E66464',
      },
      {
        hora: '09:00',
        paciente: 'Tania Morelia Pérez Dick',
        estado: 'Pendiente',
        color: '#9CA3AF',
      },
    ],
  };

  const calendario = {
    mes: 'Octubre 2025',
    diasSemana: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    filas: [
      [' ', ' ', '1', '2', '3', '4', ' '],
      ['5', '6', '7', '8', '9', '10', '11'],
      ['12', '13', '14', '15', '16', '17', '18'],
      ['19', '20', '21', '22', '23', '24', '25'],
      ['26', '27', '28', '29', '30', '31', '1'],
    ],
    diaSeleccionado: '31',
  };

  return (
    <main style={{ background: '#F8EAE7', minHeight: '100vh' }}>
      {/* breadcrumb con el título como en el mockup */}
      <Breadcrumb title="Bienvenida Dra. Ana" subtitle="Página Principal / Médico" />

      <div className="container" style={{ maxWidth: '1050px' }}>
        {/* tarjetas resumen */}
        <div
          className="d-flex flex-wrap gap-4 justify-content-between"
          style={{ marginTop: '35px', marginBottom: '35px' }}
        >
          <div
            style={{
              background: '#D78584',
              borderRadius: '16px',
              width: '185px',
              height: '120px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <div style={{ fontSize: '32px', fontWeight: 700 }}>{datosResumen.citasHoy}</div>
            <div style={{ fontSize: '14px', textAlign: 'center', textTransform: 'uppercase' }}>
              Citas hoy
            </div>
          </div>
          <div
            style={{
              background: '#D78584',
              borderRadius: '16px',
              width: '185px',
              height: '120px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <div style={{ fontSize: '32px', fontWeight: 700 }}>{datosResumen.pacientesAtendidos}</div>
            <div style={{ fontSize: '14px', textAlign: 'center', textTransform: 'uppercase' }}>
              Pacientes atendidas
            </div>
          </div>
          <div
            style={{
              background: '#D78584',
              borderRadius: '16px',
              width: '185px',
              height: '120px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <div style={{ fontSize: '32px', fontWeight: 700 }}>{datosResumen.citasPendientes}</div>
            <div style={{ fontSize: '14px', textAlign: 'center', textTransform: 'uppercase' }}>
              Citas pendientes
            </div>
          </div>
          <div
            style={{
              background: '#D78584',
              borderRadius: '16px',
              width: '185px',
              height: '120px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <div style={{ fontSize: '32px', fontWeight: 700 }}>{datosResumen.nivelSatisfaccion}</div>
            <div style={{ fontSize: '14px', textAlign: 'center', textTransform: 'uppercase' }}>
              Nivel de satisfacción
              <br /> promedio
            </div>
          </div>
        </div>

        {/* citas del día */}
        <div style={{ marginBottom: '35px' }}>
          <div
            style={{
              background: 'linear-gradient(90deg, #D78584 0%, #F6B364 100%)',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              padding: '18px 26px',
              color: '#0F172A',
              fontWeight: 700,
              fontSize: '20px',
              textTransform: 'uppercase',
            }}
          >
            Citas de día - {citasDelDia.fechaLarga}
          </div>
          {citasDelDia.listado.map((cita, index) => (
            <div
              key={index}
              style={{
                display: 'grid',
                gridTemplateColumns: '110px 1fr 150px',
                alignItems: 'center',
                background: '#F4D7D6',
                border: '2px solid #D78584',
                borderTop: 'none',
                padding: '12px 18px',
              }}
            >
              {/* hora */}
              <div
                style={{
                  background: '#F4D7D6',
                  borderRight: '2px solid #D78584',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: 600,
                }}
              >
                {cita.hora}
              </div>
              {/* nombre paciente */}
              <div style={{ paddingLeft: '18px', fontWeight: 500 }}>{cita.paciente}</div>
              {/* estado */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: cita.color,
                    display: 'inline-block',
                  }}
                ></span>
                <span style={{ fontWeight: 500 }}>{cita.estado}</span>
              </div>
            </div>
          ))}
        </div>

        {/* calendario */}
        <div style={{ marginBottom: '70px' }}>
          <div
            style={{
              background: '#D78584',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              padding: '16px 26px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              color: '#fff',
              fontWeight: 600,
              fontSize: '20px',
            }}
          >
            <span style={{ fontSize: '26px' }}>⌄</span> {calendario.mes}
          </div>
          <div style={{ background: '#F4D7D6', padding: '0 0 16px 0', borderRadius: '0 0 16px 16px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                padding: '14px 14px 0 14px',
                fontWeight: 600,
                color: '#4B5563',
              }}
            >
              {calendario.diasSemana.map((dia) => (
                <div key={dia} style={{ textAlign: 'center' }}>
                  {dia}
                </div>
              ))}
            </div>
            {/* filas */}
            {calendario.filas.map((fila, idx) => (
              <div
                key={idx}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '6px 14px' }}
              >
                {fila.map((dia, i) => {
                  const esSeleccionado = dia === calendario.diaSeleccionado;
                  return (
                    <div key={i} style={{ textAlign: 'center', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {dia.trim() !== '' ? (
                        <span
                          style={
                            esSeleccionado
                              ? {
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '50%',
                                  background: '#F9B6A5',
                                  border: '2px solid #D78584',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 600,
                                }
                              : { fontWeight: 500 }
                          }
                        >
                          {dia}
                        </span>
                      ) : (
                        <span>&nbsp;</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default MedicoMain;
