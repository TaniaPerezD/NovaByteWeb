import React, { useEffect, useState } from 'react';
import { avisosVigentes } from '../../services/cumplimientoService';

// Aviso de mantenimiento dentro de la app (NB-CON-P6-03 C3): aparece desde 48 horas antes y hasta que termina.
const AvisoMantenimiento = () => {
  const [avisos, setAvisos] = useState([]);
  useEffect(() => { avisosVigentes().then(setAvisos).catch(() => setAvisos([])); }, []);
  if (!avisos.length) return null;
  const fecha = (v) => new Date(v).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <div role="status" style={{ background: '#fff4d6', color: '#5c4400', borderBottom: '1px solid #f0d58a', padding: '8px 16px', fontSize: '14px', textAlign: 'center' }}>
      {avisos.map((a) => <div key={a.id}><b>Mantenimiento programado:</b> {a.mensaje} ({fecha(a.desde)} a {fecha(a.hasta)}). Si la app no responde, llama al consultorio.</div>)}
    </div>
  );
};
export default AvisoMantenimiento;
