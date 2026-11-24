import React, { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import * as api from '../../services/incidentesService';

const celda = { padding: '9px 11px', borderBottom: '1px solid #f1d5d5', fontSize: '14px', textAlign: 'left', verticalAlign: 'top' };
const btn = (color, off) => ({ background: color, borderColor: color, color: 'white', fontWeight: 500, fontSize: '14px', borderRadius: '8px', padding: '6px 12px', cursor: off ? 'not-allowed' : 'pointer', marginRight: '6px', marginBottom: '4px', opacity: off ? 0.6 : 1 });
const tarjeta = { background: 'white', border: '1px solid #f1d5d5', borderRadius: '10px', padding: '10px 16px', minWidth: '130px' };
const caja = { background: 'white', border: '1px solid #f1d5d5', borderRadius: '10px', padding: '14px 18px', marginBottom: '12px' };
const campo = { display: 'block', width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e5c8c8', marginBottom: '8px' };
const CASILLA = { width: '20px', height: '20px', minWidth: '20px', padding: 0, marginRight: '8px' };
const colorSev = { menor: '#2f7d5b', mayor: '#b45309', critica: '#b42318' };
const fecha = (v) => (v ? new Date(v).toLocaleString('es-BO') : '—');
const aLocal = (v) => { const d = v ? new Date(v) : new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const iso = (v) => (v ? new Date(v).toISOString() : undefined);
const falla = (e) => Swal.fire({ icon: 'error', title: 'No se pudo completar', text: e.message });

const restante = (hasta) => {
  if (!hasta) return null;
  const m = Math.round((new Date(hasta) - Date.now()) / 60000);
  if (m < 0) return { texto: `vencido hace ${Math.abs(m) >= 1440 ? Math.round(-m / 1440) + ' d' : Math.abs(m) >= 60 ? Math.round(-m / 60) + ' h' : -m + ' min'}`, mal: true };
  return { texto: m >= 1440 ? `${Math.round(m / 1440)} d` : m >= 60 ? `${Math.round(m / 60)} h` : `${m} min`, mal: m < 60 };
};
const Chip = ({ children, mal }) => (
  <span style={{ display: 'inline-block', fontSize: '12px', padding: '2px 8px', borderRadius: '10px', margin: '0 4px 4px 0', background: mal ? '#fde8e6' : '#eef3f0', color: mal ? '#b42318' : '#2f5d46' }}>{children}</span>
);

// Formulario de los campos del registro (NB-FOR-P6-12): 1 a 9 al abrir y 10 a 14 durante la contención.
const FormIncidente = ({ cats, inicial, edicion, onListo, onCancelar }) => {
  const [f, setF] = useState({
    detectado_en: aLocal(inicial?.detectado_en), reportado_en: aLocal(inicial?.reportado_en), reportado_por: inicial?.reportado_por || '',
    categoria: inicial?.categoria || '', severidad: inicial?.severidad || 'menor', sistemas_afectados: inicial?.sistemas_afectados || '',
    descripcion: inicial?.descripcion || '', datos_restringidos: !!inicial?.datos_restringidos, datos_restringidos_tipo: inicial?.datos_restringidos_tipo || '',
    horas_interrupcion: inicial?.horas_interrupcion ?? '', pacientes_afectadas: inicial?.pacientes_afectadas ?? '', registros_afectados: inicial?.registros_afectados ?? '',
    horas_respuesta: inicial?.horas_respuesta ?? '', mitigacion: inicial?.mitigacion || '',
  });
  const [ocupado, setOcupado] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setOcupado(true);
    try {
      const p = { ...f, detectado_en: iso(f.detectado_en), reportado_en: iso(f.reportado_en), categoria: Number(f.categoria) || null };
      if (inicial?.alerta_id) p.alerta_id = inicial.alerta_id;
      if (inicial?.reporte_id) p.reporte_id = inicial.reporte_id;
      if (edicion) {
        ['detectado_en', 'reportado_en', 'reportado_por', 'alerta_id', 'reporte_id'].forEach((k) => delete p[k]);
        await api.actualizarIncidente(inicial.id, p);
        onListo();
      } else {
        const r = await api.crearIncidente(p);
        await Swal.fire({ icon: 'success', title: `Incidente ${r.numero} registrado`, text: r.severidad === 'critica' || r.severidad === 'mayor' ? 'Se envió el aviso directo al Director General.' : 'Se incluirá en el informe mensual.' });
        onListo();
      }
    } catch (err) {
      falla(err);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <form onSubmit={guardar} style={caja}>
      <h5 style={{ marginBottom: '10px' }}>{edicion ? `Editar ${inicial.numero}` : 'Nuevo incidente'}</h5>
      {!edicion && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <label style={{ flex: '1 1 200px' }}>Fecha y hora de detección<input type="datetime-local" value={f.detectado_en} onChange={set('detectado_en')} style={campo} required /></label>
          <label style={{ flex: '1 1 200px' }}>Fecha y hora de reporte<input type="datetime-local" value={f.reportado_en} onChange={set('reportado_en')} style={campo} required /></label>
          <label style={{ flex: '1 1 200px' }}>Quién reportó (cargo; paciente: n.º de cuenta)<input type="text" value={f.reportado_por} onChange={set('reportado_por')} style={campo} required maxLength={120} /></label>
        </div>
      )}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <label style={{ flex: '2 1 280px' }}>Categoría
          <select value={f.categoria} onChange={set('categoria')} style={campo} required>
            <option value="">Elige una de las 16…</option>
            {cats.map((c) => <option key={c.numero} value={c.numero}>{c.numero}. {c.nombre}</option>)}
          </select>
        </label>
        <label style={{ flex: '1 1 140px' }}>Severidad
          <select value={f.severidad} onChange={set('severidad')} style={campo}>
            {Object.entries(api.SEVERIDADES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </div>
      <label>Sistemas o activos afectados<input type="text" value={f.sistemas_afectados} onChange={set('sistemas_afectados')} style={campo} required maxLength={500} /></label>
      <label>Descripción (qué pasó, sin datos clínicos, nombres de pacientes, contraseñas ni claves)<textarea value={f.descripcion} onChange={set('descripcion')} rows={3} style={campo} required maxLength={2000} /></label>
      <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}>
        <input type="checkbox" checked={f.datos_restringidos} onChange={set('datos_restringidos')} style={CASILLA} />
        Datos Restringidos afectados (la severidad pasa a crítica y se escala de inmediato)
      </label>
      {f.datos_restringidos && <input type="text" value={f.datos_restringidos_tipo} onChange={set('datos_restringidos_tipo')} placeholder="¿Qué tipo de datos?" style={campo} maxLength={300} />}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {[['horas_interrupcion', 'Horas de interrupción'], ['pacientes_afectadas', 'Pacientes afectadas'], ['registros_afectados', 'Registros expuestos o alterados'], ['horas_respuesta', 'Horas de trabajo de respuesta']].map(([k, t]) => (
          <label key={k} style={{ flex: '1 1 150px' }}>{t}<input type="number" min="0" step="any" value={f[k]} onChange={set(k)} placeholder="sin dato" style={campo} /></label>
        ))}
      </div>
      <label>Medidas de mitigación<textarea value={f.mitigacion} onChange={set('mitigacion')} rows={2} style={campo} maxLength={2000} /></label>
      <button type="submit" style={btn('#2f7d5b', ocupado)} disabled={ocupado}>{edicion ? 'Guardar cambios' : 'Registrar incidente'}</button>
      <button type="button" style={btn('#8a8f98')} onClick={onCancelar}>Cancelar</button>
    </form>
  );
};

const Detalle = ({ inc, cats, recargar }) => {
  const [det, setDet] = useState(null);
  const [editando, setEditando] = useState(false);
  const [nota, setNota] = useState('');
  const [emails, setEmails] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [informe, setInforme] = useState('');
  const [cerrar, setCerrar] = useState(false);
  const [causa, setCausa] = useState('');
  const [acciones, setAcciones] = useState([{ accion: '', responsable: '', fecha: '' }]);
  const esc = inc.esc;
  const cerrado = inc.estado === 'cerrado';

  const cargar = useCallback(async () => { try { setDet(await api.obtenerIncidente(inc.id)); } catch (e) { falla(e); } }, [inc.id]);
  useEffect(() => { cargar(); }, [cargar]);
  const refrescar = async () => { await recargar(); await cargar(); };
  const hacer = (fn, ok) => async () => { try { await fn(); if (ok) await Swal.fire({ icon: 'success', title: ok, timer: 1400, showConfirmButton: false }); await refrescar(); } catch (e) { falla(e); } };

  if (editando) return <FormIncidente cats={cats} inicial={inc} edicion onListo={async () => { setEditando(false); await refrescar(); }} onCancelar={() => setEditando(false)} />;

  return (
    <div style={{ background: '#fffafa', padding: '12px 4px' }}>
      <div style={caja}>
        <p style={{ margin: '0 0 6px' }}><b>Descripción:</b> {inc.descripcion}</p>
        <p style={{ margin: '0 0 6px' }}><b>Sistemas:</b> {inc.sistemas_afectados} · <b>Detectado:</b> {fecha(inc.detectado_en)} · <b>Reportado:</b> {fecha(inc.reportado_en)} por {inc.reportado_por}</p>
        <p style={{ margin: '0 0 6px' }}><b>Datos Restringidos:</b> {inc.datos_restringidos ? `Sí. ${inc.datos_restringidos_tipo || ''}` : 'No'} · <b>Interrupción:</b> {inc.horas_interrupcion ?? 'sin dato'} h · <b>Pacientes:</b> {inc.pacientes_afectadas ?? 'sin dato'} · <b>Registros:</b> {inc.registros_afectados ?? 'sin dato'} · <b>Respuesta:</b> {inc.horas_respuesta ?? 'sin dato'} h</p>
        <p style={{ margin: '0 0 6px' }}><b>Mitigación:</b> {inc.mitigacion || 'sin dato'}</p>
        {inc.causa && <p style={{ margin: '0 0 6px' }}><b>Causa:</b> {inc.causa}</p>}
        {!cerrado && (
          <div style={{ marginTop: '8px' }}>
            <button type="button" style={btn('#8a8f98')} onClick={() => setEditando(true)}>Editar campos</button>
            {inc.datos_restringidos && !inc.filtracion_confirmada_en && <button type="button" style={btn('#b42318')} onClick={hacer(() => api.actualizarIncidente(inc.id, { filtracion_confirmada: true }), 'Filtración confirmada: corre el plazo de 72 horas')}>Confirmar filtración</button>}
            {!inc.cierre_tecnico_en && <button type="button" style={btn('#8a8f98')} onClick={hacer(() => api.actualizarIncidente(inc.id, { cierre_tecnico: true }), 'Cierre técnico registrado')}>Registrar cierre técnico</button>}
            {inc.estado === 'abierto' && <button type="button" style={btn('#8a8f98')} onClick={hacer(() => api.actualizarIncidente(inc.id, { en_seguimiento: true }))}>Pasar a seguimiento</button>}
            <button type="button" style={btn('#2f7d5b')} onClick={() => setCerrar(!cerrar)}>Cerrar incidente</button>
          </div>
        )}
      </div>

      {cerrar && !cerrado && (
        <div style={caja}>
          <h6>Cierre y lecciones aprendidas (campos 17 a 20)</h6>
          <textarea value={causa} onChange={(e) => setCausa(e.target.value)} rows={2} placeholder="Causa identificada" style={campo} />
          {acciones.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input type="text" placeholder="Acción correctiva" value={a.accion} onChange={(e) => setAcciones(acciones.map((x, k) => (k === i ? { ...x, accion: e.target.value } : x)))} style={{ ...campo, flex: '2 1 220px' }} />
              <input type="text" placeholder="Responsable" value={a.responsable} onChange={(e) => setAcciones(acciones.map((x, k) => (k === i ? { ...x, responsable: e.target.value } : x)))} style={{ ...campo, flex: '1 1 150px' }} />
              <input type="date" value={a.fecha} onChange={(e) => setAcciones(acciones.map((x, k) => (k === i ? { ...x, fecha: e.target.value } : x)))} style={{ ...campo, flex: '1 1 140px' }} />
            </div>
          ))}
          <button type="button" style={btn('#8a8f98')} onClick={() => setAcciones([...acciones, { accion: '', responsable: '', fecha: '' }])}>Agregar acción</button>
          <button type="button" style={btn('#2f7d5b')} onClick={hacer(() => api.cerrarIncidente(inc.id, causa, acciones), 'Incidente cerrado')}>Cerrar</button>
        </div>
      )}

      {inc.acciones.length > 0 && (
        <div style={caja}>
          <h6>Acciones correctivas</h6>
          {inc.acciones.map((a, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '4px', color: !a.cumplida && a.fecha < new Date().toISOString().slice(0, 10) ? '#b42318' : undefined }}>
              <input type="checkbox" checked={!!a.cumplida} onChange={(e) => hacer(() => api.marcarAccion(inc.id, i, e.target.checked))()} style={CASILLA} />
              {a.accion} — {a.responsable} (hasta {a.fecha})
            </label>
          ))}
        </div>
      )}

      <div style={caja}>
        <h6>Escalamiento al Director General</h6>
        {!esc ? <p style={{ margin: 0, color: '#4E5865' }}>Severidad menor: se informa en el informe mensual.</p> : (
          <>
            <p style={{ margin: '0 0 6px' }}>
              Aviso enviado: {esc.aviso_enviado_en ? fecha(esc.aviso_enviado_en) : <b style={{ color: '#b42318' }}>pendiente de envío</b>} · plazo de acuse: {esc.plazo_horas === 1 ? '1 hora' : `${esc.plazo_horas} horas`}
            </p>
            <p style={{ margin: '0 0 6px' }}>
              Acuse: {esc.acuse_en ? <b style={{ color: '#2f7d5b' }}>{esc.acuse_por} · {fecha(esc.acuse_en)}</b> : <b style={{ color: '#b42318' }}>sin acuse{esc.segundo_aviso_en ? ` (segundo aviso a las ${new Date(esc.segundo_aviso_en).toLocaleTimeString('es-BO')})` : ''}</b>}
            </p>
            {esc.decision && (
              <p style={{ margin: '0 0 6px' }}>Decisión: <b>{api.DECISIONES[esc.decision]}</b>{esc.activa_pcn ? ' · activa el plan de continuidad' : ''}{esc.declara_crisis ? ' · declara la crisis' : ''}{esc.autoriza_comunicar ? ' · autoriza comunicar a las pacientes' : ''}</p>
            )}
            <p style={{ margin: '0 0 6px' }}>Informe posterior: {esc.informe_entregado_en ? `entregado ${fecha(esc.informe_entregado_en)}` : `vence ${fecha(esc.informe_vence)} (5 días hábiles)`}</p>
            {esc.acuse_en && !esc.informe_entregado_en && (
              <>
                <textarea value={informe} onChange={(e) => setInforme(e.target.value)} rows={3} placeholder="Informe posterior: causa, impacto y acciones" style={campo} />
                <button type="button" style={btn('#2f7d5b')} onClick={hacer(() => api.entregarInformePosterior(esc.id, informe), 'Informe enviado al Director General')}>Entregar informe posterior</button>
              </>
            )}
          </>
        )}
      </div>

      <div style={caja}>
        <h6>Pacientes afectadas y comunicación (72 horas)</h6>
        <p style={{ margin: '0 0 6px', color: '#4E5865' }}>
          Registradas: <b>{inc.afectadas}</b>.{' '}
          {inc.comunicado_pacientes_en ? `Comunicación enviada ${fecha(inc.comunicado_pacientes_en)}.` : inc.comunicar_vence ? `Debes comunicar antes de ${fecha(inc.comunicar_vence)}.` : 'Se confirma la filtración para empezar a contar las 72 horas.'}
        </p>
        <input type="text" value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="Correos de las pacientes afectadas, separados por coma" style={campo} />
        <button type="button" style={btn('#8a8f98')} onClick={hacer(async () => { const r = await api.registrarAfectadas(inc.id, emails.split(',').map((x) => x.trim()).filter(Boolean)); setEmails(''); if (r.no_encontradas?.length) Swal.fire({ icon: 'info', title: 'Algunos correos no corresponden a una paciente', text: r.no_encontradas.join(', ') }); })}>Registrar afectadas</button>
        <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={3} placeholder="Mensaje para las pacientes: qué datos se afectaron, qué se hizo y qué pueden hacer (sin datos clínicos)" style={{ ...campo, marginTop: '8px' }} />
        <button type="button" style={btn('#b42318', !esc?.autoriza_comunicar)} disabled={!esc?.autoriza_comunicar} onClick={hacer(async () => { await api.comunicarPacientes(inc.id, mensaje); setMensaje(''); }, 'Comunicación enviada')}>Comunicar a las pacientes</button>
        {!esc?.autoriza_comunicar && <small style={{ color: '#8a8f98' }}> Disponible cuando el Director General lo autorice.</small>}
        {det?.comunicaciones?.length > 0 && det.comunicaciones.map((c, i) => <p key={i} style={{ margin: '6px 0 0', fontSize: '13px' }}>Enviada a {c.destinatarios}: {c.mensaje}</p>)}
      </div>

      <div style={caja}>
        <h6>Notas con fecha</h6>
        {(det?.notas || []).map((n, i) => <p key={i} style={{ margin: '0 0 4px', fontSize: '14px', color: n.automatica ? '#4E5865' : undefined }}>{fecha(n.creada_en)} — {n.nota}</p>)}
        {!det?.notas?.length && <p style={{ margin: 0, color: '#8a8f98' }}>Sin notas.</p>}
        <input type="text" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Agregar una nota (las correcciones se hacen con notas, no se borra nada)" style={{ ...campo, marginTop: '8px' }} maxLength={1000} />
        <button type="button" style={btn('#8a8f98', nota.trim().length < 3)} disabled={nota.trim().length < 3} onClick={hacer(async () => { await api.agregarNota(inc.id, nota); setNota(''); })}>Agregar nota</button>
      </div>
    </div>
  );
};

const Incidentes = () => {
  const [tab, setTab] = useState('incidentes');
  const [cats, setCats] = useState([]);
  const [res, setRes] = useState(null);
  const [lista, setLista] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [abierto, setAbierto] = useState(null);
  const [nuevo, setNuevo] = useState(null); // null | {} | {prefill}
  const [cargando, setCargando] = useState(true);
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [informe, setInforme] = useState(null);
  const [anual, setAnual] = useState(null);
  const [simulacros, setSimulacros] = useState([]);

  const cargar = useCallback(async () => {
    try {
      const [c, r, l, ev, s] = await Promise.all([api.categorias(), api.resumen(), api.listarIncidentes(), api.listarEventos(), api.listarSimulacros()]);
      setCats(c); setRes(r); setLista(l); setEventos(ev); setSimulacros(s);
    } catch (e) { falla(e); } finally { setCargando(false); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const cargarInforme = useCallback(async () => {
    try { setInforme(await api.informeMensual(anio, mes)); setAnual(await api.informeAnual(anio)); } catch (e) { falla(e); }
  }, [anio, mes]);
  useEffect(() => { if (tab === 'informes') cargarInforme(); }, [tab, cargarInforme]);

  const descartar = async (ev) => {
    const r = await Swal.fire({ title: 'Descartar el reporte', input: 'textarea', inputLabel: 'Por qué no es un incidente', showCancelButton: true, confirmButtonText: 'Descartar', cancelButtonText: 'Cancelar', inputValidator: (v) => (!v || v.trim().length < 3 ? 'Escribe el motivo' : undefined) });
    if (!r.isConfirmed) return;
    try { await api.descartarEvento(ev.id, r.value); await cargar(); } catch (e) { falla(e); }
  };

  const pestana = (id, texto, n) => (
    <button type="button" onClick={() => setTab(id)} style={{ ...btn(tab === id ? '#E79796' : '#8a8f98'), fontSize: '15px', padding: '8px 16px' }}>{texto}{n ? ` (${n})` : ''}</button>
  );

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ marginBottom: '6px' }}>Incidentes de seguridad</h2>
      <p style={{ color: '#4E5865' }}>Registro de incidentes (16 categorías), escalamiento directo al Director General y comunicación a las pacientes. Nadie borra filas: se corrige con notas.</p>
      {res && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '12px 0' }}>
          <div style={tarjeta}><b style={{ fontSize: '22px' }}>{res.abiertos}</b><br />abiertos</div>
          <div style={tarjeta}><b style={{ fontSize: '22px', color: res.criticos_abiertos > 0 ? '#b42318' : undefined }}>{res.criticos_abiertos}</b><br />críticos abiertos</div>
          <div style={{ ...tarjeta, borderColor: res.sin_acuse > 0 ? '#b42318' : '#f1d5d5' }}><b style={{ fontSize: '22px', color: res.sin_acuse > 0 ? '#b42318' : undefined }}>{res.sin_acuse}</b><br />escalamientos sin acuse</div>
          <div style={tarjeta}><b style={{ fontSize: '22px' }}>{res.eventos_nuevos}</b><br />eventos por abrir</div>
          <div style={tarjeta}><b style={{ fontSize: '22px', color: res.acciones_vencidas > 0 ? '#b42318' : undefined }}>{res.acciones_vencidas}</b><br />acciones vencidas</div>
          <div style={tarjeta}><b style={{ fontSize: '22px' }}>{res.informes_pendientes}</b><br />informes posteriores pendientes</div>
        </div>
      )}
      <div style={{ margin: '8px 0 14px' }}>
        {pestana('incidentes', 'Incidentes', lista.filter((x) => x.estado !== 'cerrado').length)}
        {pestana('eventos', 'Eventos reportados', eventos.filter((x) => x.estado === 'nuevo').length)}
        {pestana('informes', 'Informes y simulacro')}
      </div>

      {cargando ? <p>Cargando…</p> : tab === 'incidentes' && (
        <>
          {!nuevo && <button type="button" style={btn('#2f7d5b')} onClick={() => setNuevo({})}>Nuevo incidente</button>}
          {nuevo && <FormIncidente cats={cats} inicial={Object.keys(nuevo).length ? nuevo : null} onListo={async () => { setNuevo(null); await cargar(); }} onCancelar={() => setNuevo(null)} />}
          <div style={{ overflowX: 'auto', background: 'white', borderRadius: '10px', border: '1px solid #f1d5d5', marginTop: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['N.º', 'Categoría', 'Severidad', 'Estado', 'Plazos y avisos'].map((h) => <th key={h} style={{ ...celda, background: '#fdf2f2' }}>{h}</th>)}</tr></thead>
              <tbody>
                {lista.length === 0 && <tr><td style={celda} colSpan={5}>Todavía no hay incidentes registrados.</td></tr>}
                {lista.map((i) => {
                  const rc = restante(i.comunicar_vence), rl = restante(i.lecciones_vence);
                  return (
                    <React.Fragment key={i.id}>
                      <tr onClick={() => setAbierto(abierto === i.id ? null : i.id)} style={{ cursor: 'pointer', background: abierto === i.id ? '#fff5f5' : undefined }}>
                        <td style={celda}><b>{i.numero}</b></td>
                        <td style={celda}>{i.categoria}. {i.categoria_nombre}<br /><small style={{ color: '#8a8f98' }}>{fecha(i.reportado_en)}</small></td>
                        <td style={{ ...celda, color: colorSev[i.severidad], fontWeight: 600 }}>{api.SEVERIDADES[i.severidad]}</td>
                        <td style={celda}>{api.ESTADOS_INCIDENTE[i.estado]}</td>
                        <td style={celda}>
                          {i.registro_tardio && <Chip mal>registro fuera de las 2 h</Chip>}
                          {i.esc && (i.esc.acuse_en ? <Chip>acuse ✓</Chip> : <Chip mal>sin acuse</Chip>)}
                          {i.esc && i.esc.acuse_en && !i.esc.informe_entregado_en && <Chip mal={restante(i.esc.informe_vence)?.mal}>informe posterior {restante(i.esc.informe_vence)?.texto}</Chip>}
                          {rc && <Chip mal={rc.mal}>comunicar a pacientes: {rc.texto}</Chip>}
                          {rl && <Chip mal={rl.mal}>lecciones: {rl.texto}</Chip>}
                          {i.acciones_vencidas > 0 && <Chip mal>{i.acciones_vencidas} acción(es) vencida(s)</Chip>}
                        </td>
                      </tr>
                      {abierto === i.id && <tr><td colSpan={5} style={{ padding: 0 }}><Detalle inc={i} cats={cats} recargar={cargar} /></td></tr>}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!cargando && tab === 'eventos' && (
        <div style={{ overflowX: 'auto', background: 'white', borderRadius: '10px', border: '1px solid #f1d5d5' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Reportado', 'Quién', 'Qué reportó', 'Estado', 'Acciones'].map((h) => <th key={h} style={{ ...celda, background: '#fdf2f2' }}>{h}</th>)}</tr></thead>
            <tbody>
              {eventos.length === 0 && <tr><td style={celda} colSpan={5}>No hay eventos reportados.</td></tr>}
              {eventos.map((ev) => {
                const r = restante(ev.registro_vence);
                return (
                  <tr key={ev.id}>
                    <td style={celda}>{fecha(ev.reportado_en)}{ev.estado === 'nuevo' && r && <><br /><Chip mal={r.mal}>abrir registro: {r.texto}</Chip></>}</td>
                    <td style={celda}>{ev.cargo}</td>
                    <td style={celda}>{ev.descripcion}{ev.sistemas && <><br /><small>Sistema: {ev.sistemas}</small></>}{ev.nota && <><br /><small style={{ color: '#8a8f98' }}>{ev.nota}</small></>}</td>
                    <td style={celda}>{{ nuevo: 'Nuevo', convertido: 'Convertido en incidente', descartado: 'Descartado' }[ev.estado]}</td>
                    <td style={celda}>
                      {ev.estado === 'nuevo' ? (
                        <>
                          <button type="button" style={btn('#2f7d5b')} onClick={() => { setTab('incidentes'); setNuevo({ descripcion: ev.descripcion, sistemas_afectados: ev.sistemas || '', reportado_por: ev.cargo, reportado_en: ev.reportado_en, detectado_en: ev.reportado_en, reporte_id: ev.id }); }}>Abrir incidente</button>
                          <button type="button" style={btn('#8a8f98')} onClick={() => descartar(ev)}>Descartar</button>
                        </>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!cargando && tab === 'informes' && (
        <>
          <div style={caja}>
            <h5>Informe mensual al Director General</h5>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <select value={mes} onChange={(e) => setMes(Number(e.target.value))} style={{ ...campo, width: 'auto', marginBottom: 0 }} aria-label="Mes">
                {['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'].map((m, k) => <option key={m} value={k + 1}>{m}</option>)}
              </select>
              <input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} style={{ ...campo, width: '110px', marginBottom: 0 }} aria-label="Año" />
              <button type="button" style={btn('#2f7d5b')} onClick={async () => { try { await api.enviarInformeMensual(anio, mes); Swal.fire({ icon: 'success', title: 'Informe enviado al Director General' }); } catch (e) { falla(e); } }}>Enviar al Director General</button>
            </div>
            <small style={{ color: '#8a8f98' }}>El informe del mes anterior también se envía solo el día 1 de cada mes.</small>
            {informe && (
              <div style={{ marginTop: '10px' }}>
                <p><b>{informe.periodo}:</b> {informe.total} incidente(s) — menores {informe.por_severidad.menor}, mayores {informe.por_severidad.mayor}, críticos {informe.por_severidad.critica}</p>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Categoría', 'Cantidad', 'Críticos'].map((h) => <th key={h} style={{ ...celda, background: '#fdf2f2' }}>{h}</th>)}</tr></thead>
                  <tbody>{informe.por_categoria.filter((c) => c.total > 0).map((c) => <tr key={c.numero}><td style={celda}>{c.numero}. {c.nombre}</td><td style={celda}>{c.total}</td><td style={celda}>{c.criticos}</td></tr>)}
                    {informe.total === 0 && <tr><td style={celda} colSpan={3}>Sin incidentes en el periodo.</td></tr>}</tbody>
                </table>
                <p style={{ marginTop: '10px' }}><b>Impacto:</b> {informe.impacto.horas_interrupcion} h de interrupción · {informe.impacto.pacientes_afectadas} paciente(s) · {informe.impacto.registros_afectados} registro(s) · {informe.impacto.horas_respuesta} h de respuesta · {informe.impacto.con_datos_restringidos} con Datos Restringidos</p>
                <p><b>Acciones correctivas:</b> {informe.acciones.total} · cumplidas {informe.acciones.cumplidas} · vencidas {informe.acciones.vencidas}</p>
              </div>
            )}
          </div>
          {anual && (
            <div style={caja}>
              <h5>Comparación mensual {anual.anio}</h5>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={{ ...celda, background: '#fdf2f2' }}>Mes</th>{anual.meses.map((m) => <th key={m.mes} style={{ ...celda, background: '#fdf2f2' }}>{m.mes}</th>)}</tr></thead>
                  <tbody>
                    <tr><td style={celda}>Incidentes</td>{anual.meses.map((m) => <td key={m.mes} style={celda}>{m.total}</td>)}</tr>
                    <tr><td style={celda}>Críticos</td>{anual.meses.map((m) => <td key={m.mes} style={celda}>{m.criticos}</td>)}</tr>
                    <tr><td style={celda}>Horas sin servicio</td>{anual.meses.map((m) => <td key={m.mes} style={celda}>{m.horas_interrupcion}</td>)}</tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div style={caja}>
            <h5>Simulacro anual de escalamiento</h5>
            <p style={{ color: '#4E5865' }}>El OSI avisa al Director General por el medio previsto y se mide el tiempo hasta el acuse.</p>
            <button type="button" style={btn('#b45309')} onClick={async () => { try { await api.iniciarSimulacro(); Swal.fire({ icon: 'success', title: 'Simulacro iniciado', text: 'Se envió el aviso de simulacro al Director General.' }); await cargar(); } catch (e) { falla(e); } }}>Iniciar simulacro</button>
            {simulacros.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead><tr>{['Fecha', 'Aviso enviado', 'Acuse', 'Minutos hasta el acuse'].map((h) => <th key={h} style={{ ...celda, background: '#fdf2f2' }}>{h}</th>)}</tr></thead>
                <tbody>{simulacros.map((s) => (
                  <tr key={s.id}><td style={celda}>{fecha(s.creado_en)}</td><td style={celda}>{fecha(s.aviso_enviado_en)}</td><td style={celda}>{s.acuse_en ? `${s.acuse_por} · ${fecha(s.acuse_en)}` : 'sin acuse'}</td>
                    <td style={{ ...celda, color: s.minutos_hasta_acuse > s.plazo_minutos ? '#b42318' : undefined }}>{s.minutos_hasta_acuse ?? '—'} (plazo {s.plazo_minutos})</td></tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Incidentes;
