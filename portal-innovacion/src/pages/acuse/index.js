import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import PaginaPublica from '../../components/PaginaPublica';
import Breadcrumb from '../../components/Breadcrumb';
import { escalamientoPorToken, acusarEscalamiento, DECISIONES, SEVERIDADES } from '../../services/incidentesService';

const caja = { background: 'white', border: '1px solid #f1d5d5', borderRadius: '10px', padding: '18px 22px', marginBottom: '16px' };
const CASILLA = { width: '22px', height: '22px', minWidth: '22px', flex: '0 0 22px', marginTop: '3px', padding: 0 };
const btn = (off) => ({ background: '#E79796', borderColor: '#E79796', color: 'white', fontWeight: 500, fontSize: '17px', borderRadius: '8px', padding: '10px 26px', cursor: off ? 'not-allowed' : 'pointer', opacity: off ? 0.6 : 1 });
const fecha = (v) => (v ? new Date(v).toLocaleString('es-BO') : '—');

// Página del Director General (NB-PRO-P6-13): el enlace del correo es secreto y de un solo destinatario.
// Aquí confirma que recibió el aviso (acuse) y registra su decisión.
const Acuse = () => {
  const token = new URLSearchParams(useLocation().search).get('token') || '';
  const [estado, setEstado] = useState('cargando'); // cargando | invalido | listo
  const [d, setD] = useState(null);
  const [nombre, setNombre] = useState('');
  const [decision, setDecision] = useState('');
  const [pcn, setPcn] = useState(false);
  const [crisis, setCrisis] = useState(false);
  const [comunicar, setComunicar] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const cargar = async () => {
    try {
      const r = await escalamientoPorToken(token);
      if (!r?.valido) { setEstado('invalido'); return; }
      setD(r);
      setEstado('listo');
    } catch (e) {
      setEstado('invalido');
    }
  };
  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [token]);

  const enviar = async (conDecision) => {
    setEnviando(true);
    try {
      await acusarEscalamiento(token, nombre, conDecision ? decision : null, pcn, crisis, comunicar);
      await Swal.fire({ icon: 'success', title: conDecision ? 'Decisión registrada' : 'Recepción confirmada', timer: 1600, showConfirmButton: false });
      await cargar();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'No se pudo registrar', text: e.message });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <PaginaPublica>
      <main>
        <Breadcrumb title="Escalamiento de seguridad" />
        <div className="it-signup-area pt-120 pb-120" style={{ background: '#FFF5F5' }}>
          <div className="container" style={{ maxWidth: '860px' }}>
            {estado === 'cargando' && <p>Cargando…</p>}
            {estado === 'invalido' && <p role="alert">El enlace no es válido o venció. Pide al OSI que envíe un aviso nuevo.</p>}
            {estado === 'listo' && d && (
              <>
                <h4 style={{ fontSize: '28px', marginBottom: '10px' }}>
                  {d.simulacro ? 'Simulacro de escalamiento' : `Incidente ${d.numero}`} · severidad {SEVERIDADES[d.severidad] || d.severidad}
                </h4>
                <div style={caja}>
                  <p><b>Por qué se escala:</b> {d.disparador}</p>
                  {!d.simulacro && (
                    <>
                      <p><b>Qué pasó:</b> {d.descripcion}</p>
                      <p><b>Cuándo:</b> {fecha(d.detectado_en)}</p>
                      <p><b>Categoría:</b> {d.categoria}</p>
                      <p><b>Sistemas afectados:</b> {d.sistemas}</p>
                      <p><b>Datos Restringidos:</b> {d.datos_restringidos ? `Sí. ${d.datos_restringidos_tipo || ''}` : 'Sin datos restringidos confirmados'}</p>
                      <p><b>Pacientes afectadas (estimado):</b> {d.pacientes_afectadas ?? 'sin dato'}</p>
                      <p style={{ marginBottom: 0 }}><b>Medidas de contención:</b> {d.mitigacion || 'en curso'}</p>
                    </>
                  )}
                  {d.simulacro && <p style={{ marginBottom: 0 }}>No hay un incidente real: confirma la recepción para medir el tiempo hasta el acuse.</p>}
                </div>

                {!d.acuse_en ? (
                  <div style={caja}>
                    <h5 style={{ fontSize: '22px' }}>1. Confirmar que recibiste el aviso</h5>
                    <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre completo (acuse de recibo)" maxLength={100}
                      style={{ display: 'block', width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5c8c8', margin: '10px 0' }} />
                    <button type="button" className="ed-btn-theme" style={btn(nombre.trim().length < 3 || enviando)} disabled={nombre.trim().length < 3 || enviando} onClick={() => enviar(false)}>
                      Confirmar recepción
                    </button>
                  </div>
                ) : (
                  <div style={caja}><b>Recepción confirmada</b> el {fecha(d.acuse_en)}.</div>
                )}

                {d.acuse_en && !d.simulacro && (
                  d.decision ? (
                    <div style={caja}><b>Decisión registrada:</b> {DECISIONES[d.decision]} ({fecha(d.decision_en)}).</div>
                  ) : (
                    <div style={caja}>
                      <h5 style={{ fontSize: '22px' }}>2. Tu decisión</h5>
                      {Object.entries(DECISIONES).map(([k, v]) => (
                        <label key={k} style={{ display: 'flex', gap: '10px', margin: '8px 0', cursor: 'pointer' }}>
                          <input type="radio" name="decision" value={k} checked={decision === k} onChange={() => setDecision(k)} style={CASILLA} /> <span>{v}</span>
                        </label>
                      ))}
                      <label style={{ display: 'flex', gap: '10px', margin: '8px 0', cursor: 'pointer' }}>
                        <input type="checkbox" checked={pcn} onChange={(e) => setPcn(e.target.checked)} style={CASILLA} /> <span>Activar el plan de continuidad (NB-PLN-P7-01)</span>
                      </label>
                      <label style={{ display: 'flex', gap: '10px', margin: '8px 0', cursor: 'pointer' }}>
                        <input type="checkbox" checked={crisis} onChange={(e) => setCrisis(e.target.checked)} style={CASILLA} /> <span>Declarar la crisis (NB-PLN-P7-02)</span>
                      </label>
                      <label style={{ display: 'flex', gap: '10px', margin: '8px 0 14px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={comunicar} onChange={(e) => setComunicar(e.target.checked)} style={CASILLA} /> <span>Autorizar la comunicación a las pacientes afectadas</span>
                      </label>
                      <button type="button" className="ed-btn-theme" style={btn(!decision || enviando)} disabled={!decision || enviando} onClick={() => enviar(true)}>
                        Registrar decisión
                      </button>
                    </div>
                  )
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </PaginaPublica>
  );
};

export default Acuse;
