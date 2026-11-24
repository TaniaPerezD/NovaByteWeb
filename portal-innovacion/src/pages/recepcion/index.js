import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { supabase } from '../../services/supabaseClient';
import { recepcionDirectorio } from '../../services/rolesService';

const celda = { padding: '9px 11px', borderBottom: '1px solid #f1d5d5', fontSize: '14px', textAlign: 'left', verticalAlign: 'top' };
const caja = { background: 'white', border: '1px solid #f1d5d5', borderRadius: '10px', padding: '14px 18px', marginBottom: '14px' };
const campo = { display: 'block', width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e5c8c8', marginBottom: '8px' };
const btn = (color) => ({ background: color, borderColor: color, color: 'white', fontWeight: 500, fontSize: '14px', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', marginRight: '6px' });
const fecha = (v) => (v ? new Date(v).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const falla = (e) => Swal.fire({ icon: 'error', title: 'No se pudo completar', text: e.message });

// Agenda de Recepción / Administración (NB-MAT-P3-07): leer, crear, modificar y borrar citas. No hay acceso al expediente.
const Recepcion = () => {
  const [citas, setCitas] = useState([]);
  const [dir, setDir] = useState([]);
  const [nueva, setNueva] = useState({ paciente_id: '', medico_id: '', fecha_hora: '', tipo_cita: 'control' });
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const [{ data, error }, d] = await Promise.all([
        supabase.from('cita').select('id, paciente_id, medico_id, fecha_hora, estado, tipo_cita').order('fecha_hora', { ascending: false }).limit(200),
        recepcionDirectorio(),
      ]);
      if (error) throw error;
      setCitas(data || []);
      setDir(d);
    } catch (e) { falla(e); } finally { setCargando(false); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const nombre = useMemo(() => Object.fromEntries(dir.map((p) => [p.id, p.nombre])), [dir]);
  const pacientes = dir.filter((p) => p.rol === 'paciente');
  const medicos = dir.filter((p) => p.rol !== 'paciente');

  const crear = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('cita').insert({ ...nueva, fecha_hora: new Date(nueva.fecha_hora).toISOString(), estado: 'programada' });
    if (error) return falla(error);
    setNueva({ paciente_id: '', medico_id: '', fecha_hora: '', tipo_cita: 'control' });
    cargar();
  };
  const cambiar = async (c, estado) => {
    const { error } = await supabase.from('cita').update({ estado }).eq('id', c.id);
    if (error) return falla(error);
    cargar();
  };
  const borrar = async (c) => {
    const r = await Swal.fire({ icon: 'warning', title: '¿Borrar esta cita?', text: 'No se puede deshacer.', showCancelButton: true, confirmButtonText: 'Borrar', cancelButtonText: 'Cancelar' });
    if (!r.isConfirmed) return;
    const { error } = await supabase.from('cita').delete().eq('id', c.id);
    if (error) return falla(error);
    cargar();
  };

  return (
    <div style={{ padding: '8px 4px' }}>
      <div style={caja}>
        <h4 style={{ marginTop: 0 }}>Nueva cita</h4>
        <form onSubmit={crear}>
          <label htmlFor="rc-pac">Paciente</label>
          <select id="rc-pac" style={campo} required value={nueva.paciente_id} onChange={(e) => setNueva({ ...nueva, paciente_id: e.target.value })}>
            <option value="">Elige una paciente</option>
            {pacientes.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <label htmlFor="rc-med">Médico</label>
          <select id="rc-med" style={campo} required value={nueva.medico_id} onChange={(e) => setNueva({ ...nueva, medico_id: e.target.value })}>
            <option value="">Elige un médico</option>
            {medicos.map((p) => <option key={p.id} value={p.id}>{p.nombre}{p.especialidad ? ` · ${p.especialidad}` : ''}</option>)}
          </select>
          <label htmlFor="rc-fh">Fecha y hora</label>
          <input id="rc-fh" type="datetime-local" style={campo} required value={nueva.fecha_hora} onChange={(e) => setNueva({ ...nueva, fecha_hora: e.target.value })} />
          <label htmlFor="rc-tipo">Tipo</label>
          <select id="rc-tipo" style={campo} value={nueva.tipo_cita} onChange={(e) => setNueva({ ...nueva, tipo_cita: e.target.value })}>
            <option value="primera_vez">Primera vez</option><option value="control">Control</option><option value="emergencia">Emergencia</option>
            <option value="teleconsulta">Teleconsulta</option><option value="otros">Otros</option>
          </select>
          <button type="submit" style={btn('#2f7d5b')}>Crear cita</button>
        </form>
      </div>
      <div style={{ ...caja, overflowX: 'auto' }}>
        <h4 style={{ marginTop: 0 }}>Agenda ({citas.length})</h4>
        {cargando ? <p>Cargando…</p> : (
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '640px' }}>
            <thead><tr><th style={celda}>Fecha</th><th style={celda}>Paciente</th><th style={celda}>Médico</th><th style={celda}>Estado</th><th style={celda}>Acciones</th></tr></thead>
            <tbody>
              {citas.map((c) => (
                <tr key={c.id}>
                  <td style={celda}>{fecha(c.fecha_hora)}</td><td style={celda}>{nombre[c.paciente_id] || '—'}</td><td style={celda}>{nombre[c.medico_id] || '—'}</td>
                  <td style={celda}>{c.estado}</td>
                  <td style={celda}>
                    {c.estado === 'programada' && <button type="button" style={btn('#b45309')} onClick={() => cambiar(c, 'cancelada')}>Cancelar</button>}
                    <button type="button" style={btn('#b42318')} onClick={() => borrar(c)}>Borrar</button>
                  </td>
                </tr>
              ))}
              {!citas.length && <tr><td style={celda} colSpan={5}>No hay citas.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
export default Recepcion;
