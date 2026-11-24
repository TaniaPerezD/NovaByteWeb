import React, { useState } from 'react';
import Swal from 'sweetalert2';
import PaginaPublica from '../../components/PaginaPublica';
import Breadcrumb from '../../components/Breadcrumb';
import { reportarEvento } from '../../services/incidentesService';

// Reporte de un evento sospechoso (NB-PRO-P6-11, 6.1): el personal reporta de inmediato, como máximo en 1 hora.
// Las pacientes también pueden reportar. No se anotan datos clínicos, contraseñas ni claves.
const ReportarEvento = () => {
  const [descripcion, setDescripcion] = useState('');
  const [sistemas, setSistemas] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await reportarEvento(descripcion, sistemas);
      setDescripcion('');
      setSistemas('');
      await Swal.fire({ icon: 'success', title: 'Reporte enviado', text: 'El OSI abrirá el registro del incidente dentro de las 2 horas siguientes. No intentes corregirlo por tu cuenta.' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo enviar', text: err.message });
    } finally {
      setEnviando(false);
    }
  };

  const campo = { display: 'block', width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5c8c8', marginBottom: '12px' };

  return (
    <PaginaPublica>
      <main>
        <Breadcrumb title="Reportar un evento" />
        <div className="it-signup-area pt-120 pb-120" style={{ background: '#FFF5F5' }}>
          <div className="container" style={{ maxWidth: '760px' }}>
            <p style={{ color: '#4E5865' }}>
              Si viste algo sospechoso (un acceso raro, un mensaje extraño, un equipo perdido, un resultado enviado a la persona equivocada),
              cuéntalo aquí de inmediato. <b>No escribas datos clínicos, contraseñas ni claves.</b>
            </p>
            <form onSubmit={enviar} style={{ background: 'white', border: '1px solid #f1d5d5', borderRadius: '10px', padding: '20px 22px' }}>
              <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={5} maxLength={1000} required placeholder="¿Qué pasó y cuándo?" style={campo} />
              <input type="text" value={sistemas} onChange={(e) => setSistemas(e.target.value)} maxLength={300} placeholder="Sistema o equipo involucrado (opcional)" style={campo} />
              <button type="submit" className="ed-btn-theme" disabled={enviando || descripcion.trim().length < 5}
                style={{ background: '#E79796', borderColor: '#E79796', color: 'white', fontWeight: 500, fontSize: '17px', borderRadius: '8px', padding: '10px 26px', opacity: enviando || descripcion.trim().length < 5 ? 0.6 : 1 }}>
                {enviando ? 'Enviando…' : 'Enviar reporte'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </PaginaPublica>
  );
};

export default ReportarEvento;
