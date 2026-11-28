import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import PaginaPublica from '../../components/PaginaPublica';
import Breadcrumb from '../../components/Breadcrumb';
import { logoutSupabase } from '../../services/authService';
import {
  consentimientosEstado,
  registrarConsentimiento,
  crearSolicitudDerechos,
  misSolicitudesDerechos,
  misDatos,
  TIPOS_SOLICITUD,
  ESTADOS_SOLICITUD,
} from '../../services/privacidadService';

const CASILLA = { width: '22px', height: '22px', minWidth: '22px', flex: '0 0 22px', marginTop: '3px', padding: 0 };
const celda = { padding: '10px 12px', borderBottom: '1px solid #f1d5d5', fontSize: '15px', textAlign: 'left', verticalAlign: 'top' };
const btn = (color, off) => ({ background: color, borderColor: color, color: 'white', fontWeight: 500, fontSize: '16px', borderRadius: '8px', padding: '9px 20px', cursor: off ? 'not-allowed' : 'pointer', opacity: off ? 0.6 : 1 });
const caja = { background: 'white', border: '1px solid #f1d5d5', borderRadius: '10px', padding: '18px 22px', marginBottom: '16px' };
const fecha = (v) => (v ? new Date(v).toLocaleDateString('es-BO') : '—');

// «Mi privacidad» (NB-POL-P6-04): consentimientos, ver mis datos y solicitudes de derechos con plazo de 10 días hábiles.
const MiPrivacidad = () => {
  const navigate = useNavigate();
  const [consentimientos, setConsentimientos] = useState([]);
  const [eleccion, setEleccion] = useState({});
  const [solicitudes, setSolicitudes] = useState([]);
  const [tipo, setTipo] = useState('acceso');
  const [detalle, setDetalle] = useState('');
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [c, s] = await Promise.all([consentimientosEstado(), misSolicitudesDerechos()]);
      setConsentimientos(c);
      setEleccion(Object.fromEntries(c.map((x) => [x.codigo, x.otorgado])));
      setSolicitudes(s);
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'No se pudo cargar', text: e.message });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const hayCambios = consentimientos.some((c) => eleccion[c.codigo] !== c.otorgado);

  const guardarConsentimientos = async () => {
    const cambios = consentimientos.filter((c) => eleccion[c.codigo] !== c.otorgado);
    const retiraObligatorio = cambios.find((c) => c.obligatorio && eleccion[c.codigo] === false);
    if (retiraObligatorio) {
      const r = await Swal.fire({
        icon: 'warning',
        title: '¿Retirar el consentimiento obligatorio?',
        html: `Si retiras <b>${retiraObligatorio.codigo}</b>, tu cuenta se bloqueará y dejarás de usar la app. La atención sigue en el consultorio, y tu expediente se conserva por el plazo legal.`,
        showCancelButton: true,
        confirmButtonText: 'Sí, retirar y bloquear mi cuenta',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#b42318',
      });
      if (!r.isConfirmed) return;
    }
    setOcupado(true);
    try {
      // el obligatorio al final: si se retira, la cuenta se bloquea y las demás decisiones ya quedaron guardadas
      const ordenados = [...cambios].sort((a, b) => Number(a.obligatorio) - Number(b.obligatorio));
      for (const c of ordenados) await registrarConsentimiento(c.codigo, eleccion[c.codigo] === true);
      if (retiraObligatorio) {
        await logoutSupabase();
        await Swal.fire({ icon: 'success', title: 'Consentimiento retirado', text: 'Tu cuenta quedó bloqueada. Comunícate con el consultorio si quieres reactivarla.' });
        navigate('/signin');
        return;
      }
      await Swal.fire({ icon: 'success', title: 'Decisiones guardadas', timer: 1400, showConfirmButton: false });
      await cargar();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: e.message });
    } finally {
      setOcupado(false);
    }
  };

  const descargar = async () => {
    setOcupado(true);
    try {
      const datos = await misDatos();
      const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mis-datos-novabyte-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'No se pudo descargar', text: e.message });
    } finally {
      setOcupado(false);
    }
  };

  const enviarSolicitud = async (e) => {
    e.preventDefault();
    if (tipo === 'eliminacion') {
      const r = await Swal.fire({
        icon: 'warning',
        title: '¿Solicitar la eliminación de tus datos?',
        text: 'Tu expediente clínico se conserva por el plazo legal (mínimo 10 años). Los datos que no estén sujetos a conservación se eliminan o se anonimizan, y tu cuenta se cerrará.',
        showCancelButton: true,
        confirmButtonText: 'Sí, enviar la solicitud',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#b42318',
      });
      if (!r.isConfirmed) return;
    }
    setOcupado(true);
    try {
      const r = await crearSolicitudDerechos(tipo, detalle);
      setDetalle('');
      await Swal.fire({ icon: 'success', title: 'Solicitud enviada', text: `Te responderemos antes del ${fecha(r.vence_en)} (10 días hábiles).` });
      await cargar();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo enviar', text: err.message });
    } finally {
      setOcupado(false);
    }
  };

  return (
    <PaginaPublica>
      <main>
        <Breadcrumb title="Mi privacidad" />
        <div className="it-signup-area pt-120 pb-120" style={{ background: '#FFF5F5' }}>
          <div className="container" style={{ maxWidth: '980px' }}>
            {cargando ? <p>Cargando…</p> : (
              <>
                <h4 style={{ fontSize: '30px' }}>Mis consentimientos</h4>
                <p style={{ color: '#4E5865' }}>
                  Decide qué usos de tus datos autorizas. Los cambios se registran con fecha y hora. Lee el <Link to="/privacidad">aviso de privacidad</Link>.
                </p>
                {consentimientos.map((c) => (
                  <div key={c.codigo} style={caja}>
                    <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer' }}>
                      <input type="checkbox" checked={eleccion[c.codigo] === true} onChange={(ev) => setEleccion({ ...eleccion, [c.codigo]: ev.target.checked })} style={CASILLA} />
                      <span>
                        <strong>{c.codigo}. {c.titulo}</strong>{' '}
                        <span style={{ color: c.obligatorio ? '#b42318' : '#4E5865' }}>({c.obligatorio ? 'obligatorio para usar la app' : 'opcional'})</span>
                        <br />
                        <span style={{ color: '#4E5865' }}>{c.que_autoriza} Si lo retiras: {c.si_se_retira}</span>
                        <br />
                        <small style={{ color: '#8a8f98' }}>Versión {c.version}{c.fecha ? ` · última decisión: ${fecha(c.fecha)}` : ''}</small>
                      </span>
                    </label>
                  </div>
                ))}
                <button type="button" style={btn('#E79796', !hayCambios || ocupado)} disabled={!hayCambios || ocupado} onClick={guardarConsentimientos}>
                  Guardar cambios
                </button>

                <h4 style={{ fontSize: '30px', margin: '44px 0 8px' }}>Mis datos</h4>
                <div style={caja}>
                  <p style={{ margin: '0 0 12px', color: '#4E5865' }}>Descarga una copia de tu información: perfil, citas, consultas, resultados y tus consentimientos.</p>
                  <button type="button" style={btn('#8a8f98', ocupado)} disabled={ocupado} onClick={descargar}>Descargar mis datos</button>
                </div>

                <h4 style={{ fontSize: '30px', margin: '44px 0 8px' }}>Solicitudes sobre mis datos</h4>
                <form onSubmit={enviarSolicitud} style={caja}>
                  <p style={{ margin: '0 0 12px', color: '#4E5865' }}>
                    Puedes pedir ver tus datos, corregirlos, retirar un consentimiento o solicitar su eliminación. Respondemos en un máximo de 10 días hábiles.
                  </p>
                  <select value={tipo} onChange={(ev) => setTipo(ev.target.value)} style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '10px', borderRadius: '8px', border: '1px solid #e5c8c8' }} aria-label="Tipo de solicitud">
                    {Object.entries(TIPOS_SOLICITUD).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <textarea value={detalle} maxLength={1000} onChange={(ev) => setDetalle(ev.target.value)} rows={3} placeholder="Cuéntanos qué necesitas (opcional)" style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '10px', borderRadius: '8px', border: '1px solid #e5c8c8' }} />
                  <button type="submit" style={btn('#E79796', ocupado)} disabled={ocupado}>Enviar solicitud</button>
                </form>

                <div style={{ overflowX: 'auto', background: 'white', borderRadius: '10px', border: '1px solid #f1d5d5' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>{['Solicitud', 'Enviada', 'Responder antes del', 'Estado', 'Respuesta'].map((h) => <th key={h} style={{ ...celda, background: '#fdf2f2' }}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {solicitudes.length === 0 && <tr><td style={celda} colSpan={5}>Todavía no has enviado solicitudes.</td></tr>}
                      {solicitudes.map((s) => (
                        <tr key={s.id}>
                          <td style={celda}>{TIPOS_SOLICITUD[s.tipo] || s.tipo}</td>
                          <td style={celda}>{fecha(s.creada_en)}</td>
                          <td style={celda}>{fecha(s.vence_en)}</td>
                          <td style={celda}>{ESTADOS_SOLICITUD[s.estado] || s.estado}</td>
                          <td style={celda}>{s.respuesta || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </PaginaPublica>
  );
};

export default MiPrivacidad;
