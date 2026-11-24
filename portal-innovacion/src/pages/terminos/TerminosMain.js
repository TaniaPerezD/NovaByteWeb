import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Breadcrumb from '../../components/Breadcrumb';
import { supabase } from '../../services/supabaseClient';
import { logoutSupabase } from '../../services/authService';

const boton = (color, deshabilitado) => ({
  background: color,
  borderColor: color,
  color: 'white',
  fontWeight: 500,
  fontSize: '18px',
  borderRadius: '8px',
  padding: '10px 28px',
  opacity: deshabilitado ? 0.6 : 1,
  cursor: deshabilitado ? 'not-allowed' : 'pointer',
});

// Primer ingreso de la paciente (NB-CON-P6-03): ve el contrato completo y debe aceptarlo para usar la app.
// La aceptación queda registrada con fecha, hora, versión, cuenta y dispositivo, y exige el segundo factor.
const TerminosMain = () => {
  const navigate = useNavigate();
  const [estado, setEstado] = useState('cargando'); // cargando | listo | error
  const [terminos, setTerminos] = useState(null);
  const [acepto, setAcepto] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let activo = true;
    (async () => {
      const { data: est } = await supabase.rpc('estado_sesion');
      if (!activo) return;
      if (!est?.valida) { navigate('/signin', { replace: true }); return; }
      if (!est.terminos_pendientes) { navigate(est.rol === 'paciente' ? '/paciente' : '/', { replace: true }); return; }
      const { data, error } = await supabase.from('terminos').select('version, titulo, contenido').eq('vigente', true).maybeSingle();
      if (!activo) return;
      if (error || !data) { setEstado('error'); return; }
      setTerminos(data);
      setEstado('listo');
    })();
    return () => { activo = false; };
  }, [navigate]);

  const aceptar = async () => {
    setEnviando(true);
    const dispositivo = `${navigator.platform || 'web'} | ${navigator.userAgent}`.slice(0, 180);
    const { error } = await supabase.rpc('aceptar_terminos', { p_version: terminos.version, p_dispositivo: dispositivo });
    setEnviando(false);
    if (error) {
      const faltaFactor = error.code === '42501';
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo registrar la aceptación',
        text: faltaFactor ? 'Confirma de nuevo con tu segundo factor: vuelve a iniciar sesión.' : error.message,
      });
      if (faltaFactor) { await logoutSupabase(); navigate('/signin'); }
      return;
    }
    await Swal.fire({ icon: 'success', title: 'Aceptación registrada', timer: 1400, showConfirmButton: false });
    navigate('/paciente', { replace: true });
  };

  const rechazar = async () => {
    await logoutSupabase();
    navigate('/signin');
  };

  const clausulas = (terminos?.contenido || '').split('\n\n').map((c) => {
    const m = c.match(/^(Cláusula \d+\.\s[^.]+\.)\s*([\s\S]*)$/);
    return m ? { titulo: m[1], texto: m[2] } : { titulo: '', texto: c };
  });

  return (
    <main>
      <Breadcrumb title="Términos y Condiciones" />
      <div className="it-signup-area pt-120 pb-120" style={{ background: '#FFF5F5' }}>
        <div className="container" style={{ maxWidth: '860px' }}>
          {estado === 'cargando' && <p>Cargando…</p>}
          {estado === 'error' && <p role="alert">No se pudieron cargar los términos. Intenta de nuevo en unos minutos.</p>}
          {estado === 'listo' && (
            <>
              <h4 style={{ fontSize: '32px', marginBottom: '12px' }}>{terminos.titulo}</h4>
              <p style={{ color: '#4E5865' }}>
                Para usar la app de NovaByte, lea y acepte los Términos y Condiciones (versión {terminos.version}). Allí se explica
                cómo cuidar su clave, qué puede hacer en la app, cuándo se bloquea su cuenta y cómo pedir ayuda. Marque la casilla y
                confirme: su segundo factor ya fue verificado al iniciar sesión.
              </p>

              <div
                tabIndex={0}
                aria-label="Texto de los términos y condiciones"
                style={{ background: 'white', border: '1px solid #f1d5d5', borderRadius: '10px', padding: '20px 24px', maxHeight: '380px', overflowY: 'auto', margin: '18px 0' }}
              >
                {clausulas.map((c, i) => (
                  <p key={i} style={{ marginBottom: '14px', color: '#2b2f36', lineHeight: 1.6 }}>
                    {c.titulo && <strong>{c.titulo} </strong>}
                    {c.texto}
                  </p>
                ))}
              </div>

              <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '22px' }}>
                <input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} style={{ marginTop: '5px' }} />
                <span>He leído y acepto los Términos y Condiciones (versión {terminos.version}).</span>
              </label>

              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <button type="button" className="ed-btn-theme" style={boton('#E79796', !acepto || enviando)} disabled={!acepto || enviando} onClick={aceptar}>
                  {enviando ? 'Registrando…' : 'Aceptar y continuar'}
                </button>
                <button type="button" className="ed-btn-theme" style={boton('#8a8f98', enviando)} disabled={enviando} onClick={rechazar}>
                  No acepto, cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
};

export default TerminosMain;
