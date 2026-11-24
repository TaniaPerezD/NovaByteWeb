import React, { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { incidenteDesdeAlerta } from '../../services/incidentesService';
import { adminAlertas, adminAlertasResumen, adminRevisarAlerta, REGLAS, ESTADOS_ALERTA } from '../../services/deteccionService';

const celda = { padding: '10px 12px', borderBottom: '1px solid #f1d5d5', fontSize: '15px', textAlign: 'left', verticalAlign: 'top' };
const btn = (color) => ({ background: color, borderColor: color, color: 'white', fontWeight: 500, fontSize: '14px', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', marginRight: '6px', marginBottom: '4px' });
const tarjeta = { background: 'white', border: '1px solid #f1d5d5', borderRadius: '10px', padding: '12px 18px', minWidth: '150px' };
const fecha = (v) => (v ? new Date(v).toLocaleString('es-BO') : '—');

const ACCIONES = [
  { estado: 'revisada', texto: 'Revisada', color: '#8a8f98' },
  { estado: 'falso_positivo', texto: 'Falso positivo', color: '#2f7d5b' },
  { estado: 'confirmada', texto: 'Confirmada', color: '#b42318' },
];

const restante = (m) => {
  if (m < 0) return `vencida hace ${Math.ceil(-m / 60) >= 24 ? Math.ceil(-m / 1440) + ' día(s)' : Math.ceil(-m / 60) + ' h'}`;
  if (m < 90) return `${m} min`;
  if (m < 2880) return `${Math.round(m / 60)} h`;
  return `${Math.round(m / 1440)} día(s)`;
};

// Alertas de seguridad (NB-POL-P6-06, 6.4): crítica = revisión en 1 hora; normal = 1 día hábil.
const AlertasSeguridad = () => {
  const [filas, setFilas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [soloAbiertas, setSoloAbiertas] = useState(true);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const [a, r] = await Promise.all([adminAlertas(null), adminAlertasResumen()]);
      setFilas(a);
      setResumen(r);
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'No se pudo cargar', text: e.message });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const revisar = async (fila, accion) => {
    const r = await Swal.fire({
      title: `${accion.texto}: ${REGLAS[fila.regla] || fila.regla}`,
      input: 'textarea',
      inputLabel: 'Nota de la revisión (qué se comprobó y qué se decidió)',
      inputAttributes: { maxlength: 1000 },
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      inputValidator: (v) => (!v || v.trim().length < 3 ? 'Escribe una nota' : undefined),
    });
    if (!r.isConfirmed) return;
    try {
      await adminRevisarAlerta(fila.id, accion.estado, r.value);
      await cargar();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: e.message });
    }
  };

  const aIncidente = async (fila) => {
    try {
      const r = await incidenteDesdeAlerta(fila.id);
      await Swal.fire({ icon: 'success', title: `Incidente ${r.numero} registrado`, text: 'Completa los campos en «Incidentes». ' + (r.severidad === 'menor' ? '' : 'Se envió el aviso directo al Director General.') });
      await cargar();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'No se pudo crear el incidente', text: e.message });
    }
  };

  const visibles = soloAbiertas ? filas.filter((f) => f.estado === 'abierta') : filas;

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ marginBottom: '6px' }}>Alertas de seguridad</h2>
      <p style={{ color: '#4E5865' }}>
        Críticas: revisar en 1 hora. Normales: en 1 día hábil. Marca cada alerta como revisada, falso positivo o confirmada; cada trimestre se ajustan las reglas con los falsos positivos.
      </p>
      {resumen && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', margin: '14px 0' }}>
          <div style={tarjeta}><b style={{ fontSize: '24px' }}>{resumen.abiertas}</b><br />abiertas</div>
          <div style={{ ...tarjeta, borderColor: resumen.vencidas > 0 ? '#b42318' : '#f1d5d5' }}><b style={{ fontSize: '24px', color: resumen.vencidas > 0 ? '#b42318' : undefined }}>{resumen.vencidas}</b><br />vencidas</div>
          <div style={tarjeta}><b style={{ fontSize: '24px' }}>{resumen.criticas_abiertas}</b><br />críticas abiertas</div>
          <div style={tarjeta}><b style={{ fontSize: '24px' }}>{resumen.falsos_positivos_90d}</b><br />falsos positivos (90 días)</div>
          <div style={tarjeta}><b style={{ fontSize: '24px' }}>{resumen.confirmadas_90d}</b><br />confirmadas (90 días)</div>
        </div>
      )}
      <label style={{ display: 'inline-flex', gap: '8px', margin: '4px 0 14px', cursor: 'pointer' }}>
        <input type="checkbox" checked={soloAbiertas} onChange={(e) => setSoloAbiertas(e.target.checked)} style={{ width: '18px', height: '18px' }} /> Mostrar solo las abiertas
      </label>
      {cargando ? <p>Cargando…</p> : (
        <div style={{ overflowX: 'auto', background: 'white', borderRadius: '10px', border: '1px solid #f1d5d5' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Regla', 'Cuenta y origen', 'Cuándo', 'Plazo', 'Estado', 'Acciones'].map((h) => <th key={h} style={{ ...celda, background: '#fdf2f2' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {visibles.length === 0 && <tr><td style={celda} colSpan={6}>No hay alertas {soloAbiertas ? 'abiertas' : ''}.</td></tr>}
              {visibles.map((f) => {
                const abierta = f.estado === 'abierta';
                const urgente = abierta && f.minutos_restantes < (f.nivel === 'critica' ? 30 : 240);
                return (
                  <tr key={f.id}>
                    <td style={celda}>
                      <b>{f.regla}</b> <span style={{ color: f.nivel === 'critica' ? '#b42318' : '#b45309', fontSize: '13px' }}>({f.nivel === 'critica' ? 'crítica' : 'normal'})</span>
                      <br />{f.titulo}
                    </td>
                    <td style={celda}>{f.cuenta || '(sin cuenta)'}<br /><small style={{ color: '#8a8f98' }}>IP {f.ip || '—'}</small></td>
                    <td style={celda}>{fecha(f.creada_en)}</td>
                    <td style={{ ...celda, color: urgente ? '#b42318' : undefined, fontWeight: urgente ? 600 : 400 }}>{abierta ? restante(f.minutos_restantes) : '—'}</td>
                    <td style={celda}>
                      {ESTADOS_ALERTA[f.estado] || f.estado}
                      {f.nota && <><br /><small style={{ color: '#2f7d5b' }}>{f.nota}</small></>}
                    </td>
                    <td style={celda}>
                      {abierta ? <>{ACCIONES.map((a) => <button key={a.estado} type="button" style={btn(a.color)} onClick={() => revisar(f, a)}>{a.texto}</button>)}<button type="button" style={btn('#b45309')} onClick={() => aIncidente(f)}>Crear incidente</button></> : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AlertasSeguridad;
