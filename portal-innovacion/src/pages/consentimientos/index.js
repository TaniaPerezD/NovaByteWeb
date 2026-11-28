import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import HeaderFive from '../../components/Header/HeaderFive';
import FooterTwo from '../../components/Footer/FooterTwo';
import Breadcrumb from '../../components/Breadcrumb';
import Logo from '../../assets/img/logo/logo-white-2.png';
import { supabase } from '../../services/supabaseClient';
import { logoutSupabase } from '../../services/authService';
import { consentimientosEstado, registrarConsentimiento, marcarSeguridadVista } from '../../services/privacidadService';

const CASILLA = { width: '22px', height: '22px', minWidth: '22px', flex: '0 0 22px', marginTop: '3px', padding: 0 };
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

// Primer ingreso de la paciente (NB-POL-P6-04, 6.3): cuatro consentimientos separados. Sin el CI-1 no se abre la cuenta.
// Cada decisión queda registrada con versión, fecha, hora y cuenta. También se confirma la lectura de la guía de seguridad.
const Consentimientos = () => {
  const navigate = useNavigate();
  const [estado, setEstado] = useState('cargando'); // cargando | listo | error
  const [lista, setLista] = useState([]);
  const [eleccion, setEleccion] = useState({});
  const [leyoGuia, setLeyoGuia] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const { data: est } = await supabase.rpc('estado_sesion');
        if (!activo) return;
        if (!est?.valida) { navigate('/signin', { replace: true }); return; }
        if (est.rol !== 'paciente') { navigate('/', { replace: true }); return; }
        if (est.terminos_pendientes) { navigate('/terminos', { replace: true }); return; }
        if (!est.consentimiento_pendiente) { navigate('/paciente', { replace: true }); return; }
        const datos = await consentimientosEstado();
        if (!activo) return;
        setLista(datos);
        setEleccion(Object.fromEntries(datos.map((c) => [c.codigo, c.otorgado])));
        setEstado('listo');
      } catch (e) {
        if (activo) setEstado('error');
      }
    })();
    return () => { activo = false; };
  }, [navigate]);

  const obligatorio = lista.find((c) => c.obligatorio);
  const puedeContinuar = !!leyoGuia && (!obligatorio || eleccion[obligatorio.codigo] === true);

  const guardar = async () => {
    setEnviando(true);
    try {
      // el obligatorio primero: si algo falla, no queda una cuenta a medias
      const ordenados = [...lista].sort((a, b) => Number(b.obligatorio) - Number(a.obligatorio));
      for (const c of ordenados) {
        await registrarConsentimiento(c.codigo, eleccion[c.codigo] === true);
      }
      await marcarSeguridadVista();
      await Swal.fire({ icon: 'success', title: 'Decisiones registradas', timer: 1400, showConfirmButton: false });
      navigate('/paciente', { replace: true });
    } catch (e) {
      await Swal.fire({ icon: 'error', title: 'No se pudo registrar', text: e.message });
    } finally {
      setEnviando(false);
    }
  };

  const rechazar = async () => {
    await logoutSupabase();
    navigate('/signin');
  };

  const caja = { background: 'white', border: '1px solid #f1d5d5', borderRadius: '10px', padding: '18px 22px', marginBottom: '16px' };

  return (
    <>
      <HeaderFive />
      <main>
        <Breadcrumb title="Tu privacidad" />
        <div className="it-signup-area pt-120 pb-120" style={{ background: '#FFF5F5' }}>
          <div className="container" style={{ maxWidth: '900px' }}>
            {estado === 'cargando' && <p>Cargando…</p>}
            {estado === 'error' && <p role="alert">No se pudieron cargar los consentimientos. Intenta de nuevo en unos minutos.</p>}
            {estado === 'listo' && (
              <>
                <h4 style={{ fontSize: '30px', marginBottom: '10px' }}>Tú decides sobre tus datos</h4>
                <p style={{ color: '#4E5865' }}>
                  Antes de usar la app, lee cada consentimiento y marca los que aceptas. Solo el primero es obligatorio para usar la app. Puedes
                  cambiar tus decisiones cuando quieras en «Mi privacidad». Más detalle en el <Link to="/privacidad" target="_blank">aviso de privacidad</Link>.
                </p>

                {lista.map((c) => (
                  <div key={c.codigo} style={caja}>
                    <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '8px' }}>
                      <input
                        type="checkbox"
                        checked={eleccion[c.codigo] === true}
                        onChange={(e) => setEleccion({ ...eleccion, [c.codigo]: e.target.checked })}
                        style={CASILLA}
                      />
                      <span>
                        <strong>{c.codigo}. {c.titulo}</strong>{' '}
                        <span style={{ color: c.obligatorio ? '#b42318' : '#4E5865' }}>({c.obligatorio ? 'obligatorio para usar la app' : 'opcional'})</span>
                      </span>
                    </label>
                    <ul style={{ margin: 0, paddingLeft: '34px', lineHeight: 1.65, color: '#2b2f36' }}>
                      <li><b>Qué autoriza:</b> {c.que_autoriza}</li>
                      <li><b>Qué datos se usan y para qué:</b> {c.datos_y_uso}</li>
                      <li><b>Quién los ve:</b> {c.quien_ve}</li>
                      <li><b>Cuánto tiempo se guardan:</b> {c.conservacion}</li>
                      <li><b>Si lo retiras:</b> {c.si_se_retira}</li>
                    </ul>
                  </div>
                ))}

                <div style={caja}>
                  <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer' }}>
                    <input type="checkbox" checked={leyoGuia} onChange={(e) => setLeyoGuia(e.target.checked)} style={CASILLA} />
                    <span>
                      Leí la <Link to="/seguridad" target="_blank">guía de seguridad</Link> (cómo cuidar mi clave y qué hacer si pierdo mi teléfono).
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  <button type="button" className="ed-btn-theme" style={boton('#E79796', !puedeContinuar || enviando)} disabled={!puedeContinuar || enviando} onClick={guardar}>
                    {enviando ? 'Registrando…' : 'Guardar y continuar'}
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
      <FooterTwo
        footerClass="it-footer-area it-footer-bg it-footer-style-5 ed-footer-style-5 inner-style black-bg pb-70"
        footerLogo={Logo}
        btnClass="it-btn-white sky-bg"
        copyrightTextClass="it-copyright-text inner-style text-center"
      />
    </>
  );
};

export default Consentimientos;
