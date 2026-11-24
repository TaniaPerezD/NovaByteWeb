import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Breadcrumb from '../../components/Breadcrumb';
import { supabase } from '../../services/supabaseClient';
import { logoutSupabase } from '../../services/authService';
import { miAccesoExterior, habilitarAccesoExterior, quitarAccesoExterior } from '../../services/deteccionService';

const ETIQUETAS = {
  inicio_sesion: 'Inicio de sesión',
  contrasena_incorrecta: 'Contraseña incorrecta',
  codigo_incorrecto: 'Código de verificación incorrecto',
  bloqueo: 'Cuenta bloqueada',
  desbloqueo: 'Cuenta desbloqueada',
  desbloqueo_solicitado: 'Se pidió un enlace de desbloqueo',
  desbloqueo_requiere_verificacion: 'Desbloqueo pendiente de verificar identidad',
  intento_en_cuenta_bloqueada: 'Intento de ingreso con la cuenta bloqueada',
  cierre_remoto_sesion: 'Sesión cerrada a distancia',
  aceptacion_terminos: 'Aceptación de términos y condiciones',
  reset_password: 'Cambio de contraseña',
  registro_paciente: 'Registro de la cuenta',
  consentimiento_otorgado: 'Consentimiento aceptado',
  consentimiento_retirado: 'Consentimiento retirado',
  solicitud_derechos: 'Solicitud sobre tus datos enviada',
  solicitud_derechos_en_proceso: 'Tu solicitud sobre datos está en proceso',
  solicitud_derechos_atendida: 'Tu solicitud sobre datos fue atendida',
  solicitud_derechos_rechazada: 'Tu solicitud sobre datos fue respondida',
  guia_seguridad_vista: 'Guía de seguridad revisada',
  descarga_datos_propios: 'Descarga de tus datos',
  acceso_exterior_habilitado: 'Acceso desde el extranjero habilitado',
  acceso_exterior_quitado: 'Acceso desde el extranjero desactivado',
  alerta_r1: 'Alerta: tres bloqueos de la cuenta en 24 horas',
  alerta_r3: 'Alerta: ingreso rechazado desde otro país',
  alerta_r4: 'Alerta: descarga desde un dispositivo nuevo',
  alerta_r5: 'Alerta: límite de descargas alcanzado',
  alerta_r6: 'Alerta: sesiones simultáneas; se cerraron todas',
  alerta_disp: 'Aviso: ingreso desde un dispositivo nuevo',
  alerta_lim_cons: 'Aviso: se pidió confirmar tu identidad',
};

const fecha = (v) => (v ? new Date(v).toLocaleString('es-BO') : '—');
const celda = { padding: '10px 12px', borderBottom: '1px solid #f1d5d5', fontSize: '15px', textAlign: 'left', verticalAlign: 'top' };
const btn = (color) => ({ background: color, borderColor: color, color: 'white', fontWeight: 500, fontSize: '15px', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer' });

// "Mi actividad" (NB-POL-P6-08 y NB-POL-P6-02, 6.6): la persona ve sus sesiones y su actividad de seguridad,
// puede cerrar sesiones a distancia y bloquear su propia cuenta (NB-PRO-P6-05).
const MiActividadMain = () => {
  const navigate = useNavigate();
  const [sesiones, setSesiones] = useState([]);
  const [actividad, setActividad] = useState([]);
  const [rol, setRol] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [exterior, setExterior] = useState(null);
  const [diasExterior, setDiasExterior] = useState(7);

  const cargar = useCallback(async () => {
    const [s, a, e] = await Promise.all([supabase.rpc('mis_sesiones'), supabase.rpc('mi_actividad', { p_limite: 200 }), supabase.rpc('estado_sesion')]);
    setSesiones(s.data || []);
    setActividad(a.data || []);
    setRol(e.data?.rol || null);
    if (e.data?.rol === 'paciente') {
      try { setExterior(await miAccesoExterior()); } catch (err) { setExterior(null); }
    }
    setCargando(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const habilitarExterior = async () => {
    try {
      const hasta = await habilitarAccesoExterior(Number(diasExterior));
      setExterior(hasta);
      Swal.fire({ icon: 'success', title: 'Acceso desde el extranjero habilitado', text: `Podrás ingresar desde otro país hasta el ${fecha(hasta)}.` });
      cargar();
    } catch (err) {
      if (/REAUTH/.test(err.message)) {
        Swal.fire({ icon: 'info', title: 'Confirma tu identidad', text: 'Por seguridad necesitas un código reciente: cierra sesión, vuelve a ingresar con tu código y regresa aquí dentro de los 10 minutos siguientes.' });
      } else {
        Swal.fire({ icon: 'error', title: 'No se pudo habilitar', text: err.message });
      }
    }
  };

  const quitarExterior = async () => {
    try {
      await quitarAccesoExterior();
      setExterior(null);
      cargar();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo desactivar', text: err.message });
    }
  };

  const cerrarUna = async (id) => {
    const { error } = await supabase.rpc('cerrar_sesion', { p_id: id });
    if (error) { Swal.fire({ icon: 'error', title: 'No se pudo cerrar la sesión', text: error.message }); return; }
    cargar();
  };

  const cerrarOtras = async () => {
    const { data, error } = await supabase.rpc('cerrar_otras_sesiones');
    if (error) { Swal.fire({ icon: 'error', title: 'No se pudo cerrar las demás sesiones', text: error.message }); return; }
    await Swal.fire({ icon: 'success', title: 'Listo', text: `Se cerraron ${data ?? 0} sesión(es) en otros dispositivos.` });
    cargar();
  };

  const bloquear = async () => {
    const r = await Swal.fire({
      icon: 'warning',
      title: '¿Bloquear tu cuenta ahora?',
      html: 'Se cerrarán <b>todas</b> tus sesiones y nadie podrá entrar con tu cuenta. Para reactivarla, el consultorio verificará tu identidad.',
      showCancelButton: true,
      confirmButtonText: 'Sí, bloquear mi cuenta',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#b42318',
    });
    if (!r.isConfirmed) return;
    const { error } = await supabase.rpc('bloquear_mi_cuenta');
    if (error) { Swal.fire({ icon: 'error', title: 'No se pudo bloquear', text: error.message }); return; }
    await logoutSupabase();
    await Swal.fire({ icon: 'success', title: 'Cuenta bloqueada', text: 'Comunícate con el consultorio para reactivarla.' });
    navigate('/signin');
  };

  return (
    <main>
      <Breadcrumb title="Mi actividad" />
      <div className="it-signup-area pt-120 pb-120" style={{ background: '#FFF5F5' }}>
        <div className="container" style={{ maxWidth: '980px' }}>
          {cargando ? <p>Cargando…</p> : (
            <>
              <h4 style={{ fontSize: '30px' }}>Mis sesiones</h4>
              <p style={{ color: '#4E5865' }}>Las sesiones se cierran solas tras 10 minutos sin actividad y duran como máximo 12 horas.</p>
              <div style={{ overflowX: 'auto', background: 'white', borderRadius: '10px', border: '1px solid #f1d5d5' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Dispositivo', 'Dirección IP', 'Inicio', 'Última actividad', ''].map((h) => <th key={h} style={{ ...celda, background: '#fdf2f2' }}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {sesiones.length === 0 && <tr><td style={celda} colSpan={5}>No hay sesiones activas.</td></tr>}
                    {sesiones.map((s) => (
                      <tr key={s.id}>
                        <td style={celda}>{(s.dispositivo || 'Desconocido').slice(0, 70)}</td>
                        <td style={celda}>{s.ip || '—'}</td>
                        <td style={celda}>{fecha(s.creada_en)}</td>
                        <td style={celda}>{fecha(s.ultima_actividad)}</td>
                        <td style={celda}>
                          {s.actual ? <strong>Esta sesión</strong> : <button type="button" style={btn('#E79796')} onClick={() => cerrarUna(s.id)}>Cerrar</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ margin: '14px 0 40px' }}>
                <button type="button" style={btn('#8a8f98')} onClick={cerrarOtras}>Cerrar las demás sesiones</button>
              </div>

              <h4 style={{ fontSize: '30px' }}>Actividad de los últimos 12 meses</h4>
              <div style={{ overflow: 'auto', maxHeight: '460px', background: 'white', borderRadius: '10px', border: '1px solid #f1d5d5' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Qué pasó', 'Cuándo', 'Dirección IP'].map((h) => <th key={h} style={{ ...celda, background: '#fdf2f2' }}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {actividad.length === 0 && <tr><td style={celda} colSpan={3}>Todavía no hay actividad registrada.</td></tr>}
                    {actividad.map((a, i) => (
                      <tr key={i}>
                        <td style={celda}>{ETIQUETAS[a.tipo] || a.tipo}</td>
                        <td style={celda}>{fecha(a.creado_en)}</td>
                        <td style={celda}>{a.ip || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rol === 'paciente' && (
                <div style={{ marginTop: '44px', background: 'white', border: '1px solid #f1d5d5', borderRadius: '10px', padding: '20px 24px' }}>
                  <h4 style={{ fontSize: '24px' }}>Viajes al extranjero</h4>
                  <p style={{ color: '#4E5865' }}>
                    Por seguridad, tu cuenta solo permite ingresar desde Bolivia. Si vas a viajar, puedes habilitar el acceso desde otro país hasta por 30 días.
                    Para habilitarlo necesitas haber confirmado tu identidad con un código en los últimos 10 minutos.
                  </p>
                  {exterior ? (
                    <p><strong>Habilitado hasta el {fecha(exterior)}.</strong>{' '}
                      <button type="button" style={btn('#8a8f98')} onClick={quitarExterior}>Desactivar</button></p>
                  ) : (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <select value={diasExterior} onChange={(ev) => setDiasExterior(ev.target.value)} aria-label="Días de acceso desde el extranjero" style={{ padding: '9px', borderRadius: '8px', border: '1px solid #e5c8c8' }}>
                        <option value={7}>7 días</option>
                        <option value={15}>15 días</option>
                        <option value={30}>30 días</option>
                      </select>
                      <button type="button" style={btn('#E79796')} onClick={habilitarExterior}>Habilitar acceso desde el extranjero</button>
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginTop: '44px', background: 'white', border: '1px solid #f3c1bb', borderRadius: '10px', padding: '20px 24px' }}>
                <h4 style={{ fontSize: '24px', color: '#b42318' }}>¿Crees que alguien usa tu cuenta?</h4>
                <p style={{ color: '#4E5865' }}>
                  Puedes bloquearla ahora mismo. {rol === 'paciente' ? 'También puedes pedirlo por el canal telefónico o presencial del consultorio.' : ''}
                </p>
                <button type="button" style={btn('#b42318')} onClick={bloquear}>Bloquear mi cuenta</button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
};

export default MiActividadMain;
