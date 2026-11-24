import React, { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { adminSolicitudesDerechos, adminAtenderSolicitud, TIPOS_SOLICITUD, ESTADOS_SOLICITUD } from '../../services/privacidadService';

const celda = { padding: '10px 12px', borderBottom: '1px solid #f1d5d5', fontSize: '15px', textAlign: 'left', verticalAlign: 'top' };
const btn = (color) => ({ background: color, borderColor: color, color: 'white', fontWeight: 500, fontSize: '14px', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', marginRight: '6px', marginBottom: '4px' });
const fecha = (v) => (v ? new Date(v).toLocaleDateString('es-BO') : '—');

const ACCIONES = [
  { estado: 'en_proceso', texto: 'En proceso', color: '#8a8f98', pide: false },
  { estado: 'atendida', texto: 'Atender', color: '#2f7d5b', pide: true },
  { estado: 'rechazada', texto: 'Rechazar', color: '#b42318', pide: true },
];

// Solicitudes de derechos de las pacientes (NB-POL-P6-04, 6.4 y Anexo C): las atiende la administradora (OSI) en 10 días hábiles.
const SolicitudesDerechos = () => {
  const [filas, setFilas] = useState([]);
  const [soloAbiertas, setSoloAbiertas] = useState(true);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      setFilas(await adminSolicitudesDerechos(null));
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'No se pudo cargar', text: e.message });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const atender = async (fila, accion) => {
    let respuesta = null;
    if (accion.pide) {
      const r = await Swal.fire({
        title: `${accion.texto}: ${TIPOS_SOLICITUD[fila.tipo] || fila.tipo}`,
        input: 'textarea',
        inputLabel: 'Respuesta para la paciente (la verá en «Mi privacidad»)',
        inputAttributes: { maxlength: 2000 },
        showCancelButton: true,
        confirmButtonText: accion.texto,
        cancelButtonText: 'Cancelar',
        inputValidator: (v) => (!v || v.trim().length < 5 ? 'Escribe una respuesta de al menos 5 caracteres' : undefined),
        ...(fila.tipo === 'eliminacion' && accion.estado === 'atendida'
          ? { html: 'Al atender una eliminación, la cuenta se <b>cierra</b>. El expediente se conserva por el plazo legal.' }
          : {}),
      });
      if (!r.isConfirmed) return;
      respuesta = r.value;
    }
    try {
      await adminAtenderSolicitud(fila.id, accion.estado, respuesta);
      await cargar();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: e.message });
    }
  };

  const visibles = soloAbiertas ? filas.filter((f) => f.estado === 'recibida' || f.estado === 'en_proceso') : filas;
  const abiertas = filas.filter((f) => f.estado === 'recibida' || f.estado === 'en_proceso');
  const vencidas = abiertas.filter((f) => f.dias_restantes < 0).length;

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ marginBottom: '6px' }}>Derechos de las pacientes</h2>
      <p style={{ color: '#4E5865' }}>
        Solicitudes para ver, corregir, retirar o eliminar datos. Plazo de respuesta: 10 días hábiles.{' '}
        <b>{abiertas.length}</b> abierta(s){vencidas > 0 && <span style={{ color: '#b42318' }}> · {vencidas} vencida(s)</span>}.
      </p>
      <label style={{ display: 'inline-flex', gap: '8px', margin: '8px 0 14px', cursor: 'pointer' }}>
        <input type="checkbox" checked={soloAbiertas} onChange={(e) => setSoloAbiertas(e.target.checked)} /> Mostrar solo las abiertas
      </label>
      {cargando ? <p>Cargando…</p> : (
        <div style={{ overflowX: 'auto', background: 'white', borderRadius: '10px', border: '1px solid #f1d5d5' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Paciente', 'Solicitud', 'Enviada', 'Vence', 'Estado', 'Acciones'].map((h) => <th key={h} style={{ ...celda, background: '#fdf2f2' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {visibles.length === 0 && <tr><td style={celda} colSpan={6}>No hay solicitudes {soloAbiertas ? 'abiertas' : ''}.</td></tr>}
              {visibles.map((f) => {
                const abierta = f.estado === 'recibida' || f.estado === 'en_proceso';
                return (
                  <tr key={f.id}>
                    <td style={celda}>{f.paciente || '—'}<br /><small style={{ color: '#8a8f98' }}>{f.email}</small></td>
                    <td style={celda}>
                      <b>{TIPOS_SOLICITUD[f.tipo] || f.tipo}</b>
                      {f.detalle && <><br /><small>{f.detalle}</small></>}
                      {f.respuesta && <><br /><small style={{ color: '#2f7d5b' }}>Respuesta: {f.respuesta}</small></>}
                    </td>
                    <td style={celda}>{fecha(f.creada_en)}</td>
                    <td style={{ ...celda, color: abierta && f.dias_restantes <= 2 ? '#b42318' : undefined, fontWeight: abierta && f.dias_restantes <= 2 ? 600 : 400 }}>
                      {fecha(f.vence_en)}
                      {abierta && <><br /><small>{f.dias_restantes < 0 ? `vencida hace ${-f.dias_restantes} día(s)` : `${f.dias_restantes} día(s)`}</small></>}
                    </td>
                    <td style={celda}>{ESTADOS_SOLICITUD[f.estado] || f.estado}</td>
                    <td style={celda}>
                      {abierta ? ACCIONES.filter((a) => !(a.estado === 'en_proceso' && f.estado === 'en_proceso')).map((a) => (
                        <button key={a.estado} type="button" style={btn(a.color)} onClick={() => atender(f, a)}>{a.texto}</button>
                      )) : '—'}
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

export default SolicitudesDerechos;
