import React, { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import * as api from '../../services/cumplimientoService';

const caja = { background: 'white', border: '1px solid #f1d5d5', borderRadius: '10px', padding: '14px 18px', marginBottom: '14px', overflowX: 'auto' };
const celda = { padding: '7px 10px', borderBottom: '1px solid #f1d5d5', fontSize: '13px', textAlign: 'left', verticalAlign: 'top' };
const campo = { display: 'block', width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e5c8c8', marginBottom: '8px' };
const tarjeta = { background: 'white', border: '1px solid #f1d5d5', borderRadius: '10px', padding: '10px 16px', minWidth: '150px' };
const btn = (c) => ({ background: c, borderColor: c, color: 'white', fontWeight: 500, fontSize: '14px', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', marginRight: '6px', marginBottom: '4px' });
const fecha = (v) => (v ? new Date(v).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const falla = (e) => Swal.fire({ icon: 'error', title: 'No se pudo completar', text: e.message });
const iso = (v) => (v ? new Date(v).toISOString() : null);

// Retención legal, informes, actas, archivo firmado y avisos (NB-POL-P5-13, NB-POL-P6-07, NB-POL-P6-08, NB-CON-P6-03).
const Cumplimiento = () => {
  const [ret, setRet] = useState(null);
  const [alc, setAlc] = useState(null);
  const [holds, setHolds] = useState([]);
  const [acts, setActs] = useState([]);
  const [h, setH] = useState({ asunto: '', motivo: '' });
  const [av, setAv] = useState({ mensaje: '', desde: '', hasta: '' });
  const [pol, setPol] = useState({ titulo: '', resumen: '' });
  const [pi, setPi] = useState({ desde: '', hasta: '' });

  const cargar = useCallback(async () => {
    try {
      const [a, b, c, d] = await Promise.all([api.informeRetencion(), api.informeAlcance(), api.retenciones(), api.actas()]);
      setRet(a); setAlc(b); setHolds(c); setActs(d);
    } catch (e) { falla(e); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const crearHold = async (e) => {
    e.preventDefault();
    try { await api.crearRetencion(h.asunto, h.motivo); setH({ asunto: '', motivo: '' }); cargar(); } catch (er) { falla(er); }
  };
  const levantar = async (x) => {
    const n = await Swal.fire({ title: 'Levantar la retención', input: 'textarea', inputLabel: 'Nota formal del levantamiento (quién lo autoriza y por qué)', showCancelButton: true, confirmButtonText: 'Levantar', cancelButtonText: 'Cancelar', inputValidator: (v) => (!v || v.trim().length < 10 ? 'Escribe al menos 10 caracteres' : undefined) });
    if (!n.isConfirmed) return;
    try { await api.levantarRetencion(x.id, n.value); cargar(); } catch (er) { falla(er); }
  };
  const acta = async () => { try { const id = await api.generarActa(); Swal.fire({ icon: id ? 'success' : 'info', title: id ? 'Acta generada' : 'El acta de este mes ya existe' }); cargar(); } catch (er) { falla(er); } };
  const descargarPistas = async (e) => {
    e.preventDefault();
    try {
      const a = await api.exportarPistas(iso(pi.desde), iso(pi.hasta));
      const url = URL.createObjectURL(new Blob([JSON.stringify(a, null, 2)], { type: 'application/json' }));
      const l = document.createElement('a'); l.href = url; l.download = `pistas-${pi.desde.slice(0, 10)}-a-${pi.hasta.slice(0, 10)}.json`; l.click(); URL.revokeObjectURL(url);
      Swal.fire({ icon: 'success', title: 'Archivo firmado listo', text: `${a.filas} pistas. SHA-256: ${a.sha256.slice(0, 16)}…` });
    } catch (er) { falla(er); }
  };
  const verificarArchivo = async (ev) => {
    const f = ev.target.files[0]; if (!f) return;
    try { const ok = await api.verificarArchivoPistas(JSON.parse(await f.text())); Swal.fire({ icon: ok ? 'success' : 'error', title: ok ? 'Archivo auténtico: la firma coincide' : 'La firma NO coincide: el archivo fue alterado' }); } catch (er) { falla(er); }
    ev.target.value = '';
  };
  const crearAviso = async (e) => {
    e.preventDefault();
    try { await api.crearAvisoMantenimiento(av.mensaje, iso(av.desde), iso(av.hasta)); setAv({ mensaje: '', desde: '', hasta: '' }); Swal.fire({ icon: 'success', title: 'Aviso publicado en la app' }); } catch (er) { falla(er); }
  };
  const avisarPolitica = async (e) => {
    e.preventDefault();
    try {
      const sim = await api.avisarCambioPolitica(pol.titulo, pol.resumen, false);
      const c = await Swal.fire({ icon: 'question', title: `Se enviará a ${sim.destinatarios} cuentas activas`, text: 'Esto envía correos reales. ¿Continuar?', showCancelButton: true, confirmButtonText: 'Enviar', cancelButtonText: 'Cancelar' });
      if (!c.isConfirmed) return;
      const r = await api.avisarCambioPolitica(pol.titulo, pol.resumen, true);
      Swal.fire({ icon: 'success', title: `Enviados: ${r.enviados}`, text: r.fallidos ? `${r.fallidos} fallaron` : '' }); setPol({ titulo: '', resumen: '' });
    } catch (er) { falla(er); }
  };

  return (
    <div style={{ padding: '8px 4px' }}>
      {alc && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div style={tarjeta}><b style={{ fontSize: '24px' }}>{alc.pct_terminos}%</b><div>Pacientes con términos vigentes</div></div>
          <div style={tarjeta}><b style={{ fontSize: '24px' }}>{alc.pct_ci1}%</b><div>Con consentimiento de datos de salud</div></div>
          <div style={tarjeta}><b style={{ fontSize: '24px' }}>{alc.personal_con_clave_vigente}/{alc.personal_activo}</b><div>Personal con clave vigente</div></div>
          <div style={tarjeta}><b style={{ fontSize: '24px' }}>{ret ? ret.retenciones_activas : '—'}</b><div>Retenciones legales activas</div></div>
        </div>
      )}

      <div style={caja}>
        <h4 style={{ marginTop: 0 }}>Retención legal</h4>
        <p style={{ fontSize: '13px', color: '#6b6b6b' }}>Mientras haya una retención activa no se destruye ningún respaldo y no se puede borrar la cuenta involucrada. Las pistas de auditoría ya no se pueden borrar nunca.</p>
        <form onSubmit={crearHold}>
          <label htmlFor="rl-as">Asunto</label><input id="rl-as" style={campo} required minLength={5} value={h.asunto} onChange={(e) => setH({ ...h, asunto: e.target.value })} />
          <label htmlFor="rl-mo">Motivo (proceso o requerimiento)</label><textarea id="rl-mo" style={campo} required minLength={10} value={h.motivo} onChange={(e) => setH({ ...h, motivo: e.target.value })} />
          <button type="submit" style={btn('#b45309')}>Activar retención</button>
        </form>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '560px', marginTop: '10px' }}>
          <thead><tr><th style={celda}>Asunto</th><th style={celda}>Desde</th><th style={celda}>Estado</th><th style={celda}></th></tr></thead>
          <tbody>
            {holds.map((x) => (
              <tr key={x.id}><td style={celda}>{x.asunto}</td><td style={celda}>{fecha(x.creada_en)}</td>
                <td style={celda}>{x.levantada_en ? `Levantada ${fecha(x.levantada_en)}` : 'Activa'}</td>
                <td style={celda}>{!x.levantada_en && <button type="button" style={btn('#2f7d5b')} onClick={() => levantar(x)}>Levantar</button>}</td></tr>
            ))}
            {!holds.length && <tr><td style={celda} colSpan={4}>No hay retenciones.</td></tr>}
          </tbody>
        </table>
      </div>

      {ret && (
        <div style={caja}>
          <h4 style={{ marginTop: 0 }}>Informe de retención</h4>
          <p style={{ fontSize: '13px' }}>Bitácora: {ret.bitacora.total} pistas, desde {fecha(ret.bitacora.primera)} hasta {fecha(ret.bitacora.ultima)}. Pistas bajo retención: {ret.pistas_retenidas}.</p>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '560px' }}>
            <thead><tr><th style={celda}>Dato</th><th style={celda}>Plazo</th><th style={celda}>Cómo se cumple</th></tr></thead>
            <tbody>{ret.matriz.map((m) => <tr key={m.dato}><td style={celda}>{m.dato}</td><td style={celda}>{m.plazo}</td><td style={celda}>{m.mecanismo}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      <div style={caja}>
        <h4 style={{ marginTop: 0 }}>Actas mensuales</h4>
        <button type="button" style={btn('#8a8f98')} onClick={acta}>Generar el acta de este mes</button>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '520px', marginTop: '8px' }}>
          <thead><tr><th style={celda}>Periodo</th><th style={celda}>Cadena</th><th style={celda}>Pistas</th><th style={celda}>Filas sin enlazar</th><th style={celda}>Generada</th></tr></thead>
          <tbody>{acts.map((a) => <tr key={a.id}><td style={celda}>{a.periodo}</td><td style={celda}>{a.cadena_valida ? 'Íntegra' : 'ROTA'}</td><td style={celda}>{a.filas_bitacora}</td><td style={celda}>{a.huecos}</td><td style={celda}>{fecha(a.creada_en)}</td></tr>)}
            {!acts.length && <tr><td style={celda} colSpan={5}>Aún no hay actas. Se generan solas el día 1 de cada mes.</td></tr>}</tbody>
        </table>
      </div>

      <div style={caja}>
        <h4 style={{ marginTop: 0 }}>Archivo firmado de pistas para el Auditor Interno</h4>
        <form onSubmit={descargarPistas}>
          <label htmlFor="pi-d">Desde</label><input id="pi-d" type="date" style={campo} required value={pi.desde} onChange={(e) => setPi({ ...pi, desde: e.target.value })} />
          <label htmlFor="pi-h">Hasta (no incluye el día)</label><input id="pi-h" type="date" style={campo} required value={pi.hasta} onChange={(e) => setPi({ ...pi, hasta: e.target.value })} />
          <button type="submit" style={btn('#2f7d5b')}>Descargar archivo firmado</button>
        </form>
        <label htmlFor="pi-v" style={{ marginTop: '8px', display: 'block' }}>Verificar un archivo recibido</label>
        <input id="pi-v" type="file" accept="application/json" onChange={verificarArchivo} />
      </div>

      <div style={caja}>
        <h4 style={{ marginTop: 0 }}>Aviso de mantenimiento en la app</h4>
        <form onSubmit={crearAviso}>
          <label htmlFor="av-m">Mensaje</label><input id="av-m" style={campo} required minLength={5} maxLength={400} value={av.mensaje} onChange={(e) => setAv({ ...av, mensaje: e.target.value })} />
          <label htmlFor="av-d">Desde</label><input id="av-d" type="datetime-local" style={campo} required value={av.desde} onChange={(e) => setAv({ ...av, desde: e.target.value })} />
          <label htmlFor="av-h">Hasta</label><input id="av-h" type="datetime-local" style={campo} required value={av.hasta} onChange={(e) => setAv({ ...av, hasta: e.target.value })} />
          <button type="submit" style={btn('#b45309')}>Publicar aviso</button>
        </form>
      </div>

      <div style={caja}>
        <h4 style={{ marginTop: 0 }}>Avisar un cambio de política por correo</h4>
        <form onSubmit={avisarPolitica}>
          <label htmlFor="po-t">Título</label><input id="po-t" style={campo} required minLength={5} value={pol.titulo} onChange={(e) => setPol({ ...pol, titulo: e.target.value })} />
          <label htmlFor="po-r">Resumen del cambio</label><textarea id="po-r" style={campo} required minLength={10} value={pol.resumen} onChange={(e) => setPol({ ...pol, resumen: e.target.value })} />
          <button type="submit" style={btn('#b42318')}>Revisar y enviar</button>
        </form>
      </div>
    </div>
  );
};
export default Cumplimiento;
