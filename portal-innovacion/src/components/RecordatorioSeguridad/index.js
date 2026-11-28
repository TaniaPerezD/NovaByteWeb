import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { recordatorioSeguridadPendiente, marcarSeguridadVista } from '../../services/privacidadService';

// Recordatorio anual en la app (NB-POL-P6-07, C7): una vez al año se invita a repasar la guía de seguridad.
// En el primer ingreso la guía se confirma en la pantalla de consentimientos, por eso no se muestra allí.
const SIN_AVISO = ['/consentimientos', '/terminos', '/seguridad', '/signin', '/two-verification', '/new-password', '/reset-password'];

const RecordatorioSeguridad = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let activo = true;
    (async () => {
      if (SIN_AVISO.includes(pathname)) { setVisible(false); return; }
      const { data } = await supabase.auth.getSession();
      if (!data?.session) { setVisible(false); return; }
      const pendiente = await recordatorioSeguridadPendiente();
      if (activo) setVisible(pendiente);
    })();
    return () => { activo = false; };
  }, [pathname]);

  if (!visible) return null;

  const cerrar = async (verGuia) => {
    setVisible(false);
    try { await marcarSeguridadVista(); } catch (e) { /* si falla, el aviso volverá a aparecer */ }
    if (verGuia) navigate('/seguridad');
  };

  return (
    <div role="status" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 9999, background: '#fff', borderTop: '3px solid #E79796', boxShadow: '0 -4px 16px rgba(0,0,0,.12)', padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
      <span style={{ color: '#2b2f36' }}>
        <strong>Recordatorio anual:</strong> repasa la <Link to="/seguridad" onClick={() => cerrar(false)}>guía de seguridad</Link> para cuidar tu cuenta y tus datos.
      </span>
      <button type="button" onClick={() => cerrar(true)} style={{ background: '#E79796', color: '#fff', border: 0, borderRadius: '8px', padding: '6px 16px', cursor: 'pointer' }}>Ver la guía</button>
      <button type="button" onClick={() => cerrar(false)} style={{ background: '#8a8f98', color: '#fff', border: 0, borderRadius: '8px', padding: '6px 16px', cursor: 'pointer' }}>Entendido</button>
    </div>
  );
};

export default RecordatorioSeguridad;
