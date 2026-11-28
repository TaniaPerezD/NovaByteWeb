import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { supabase } from '../../services/supabaseClient';
import { dashboardKpis } from '../../services/rolesService';

const caja = { background: 'white', border: '1px solid #f1d5d5', borderRadius: '10px', padding: '14px 18px', marginBottom: '14px' };
const tarjeta = { background: 'white', border: '1px solid #f1d5d5', borderRadius: '10px', padding: '12px 18px', minWidth: '160px' };
const etiqueta = (k) => k.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

// Panel de Dirección General (NB-MAT-P3-07): agenda en solo lectura y analítica. Sin expediente ni imágenes.
const Direccion = () => {
  const [kpis, setKpis] = useState(null);
  const [citas, setCitas] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const hasta = new Date(); const desde = new Date(); desde.setMonth(desde.getMonth() - 1);
        const iso = (d) => d.toISOString().slice(0, 10);
        setKpis(await dashboardKpis(iso(desde), iso(hasta)));
        const { count, error } = await supabase.from('cita').select('id', { count: 'exact', head: true }).gte('fecha_hora', new Date().toISOString());
        if (error) throw error;
        setCitas(count);
      } catch (e) { Swal.fire({ icon: 'error', title: 'No se pudo cargar', text: e.message }); }
    })();
  }, []);

  const numeros = kpis ? Object.entries(kpis).filter(([, v]) => typeof v === 'number') : [];
  const listas = kpis ? Object.entries(kpis).filter(([, v]) => Array.isArray(v) && v.length && typeof v[0] === 'object') : [];

  return (
    <div style={{ padding: '8px 4px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
        <div style={tarjeta}><b style={{ fontSize: '26px' }}>{citas ?? '—'}</b><div>Citas por venir</div></div>
        {numeros.map(([k, v]) => <div key={k} style={tarjeta}><b style={{ fontSize: '26px' }}>{v}</b><div>{etiqueta(k)}</div></div>)}
      </div>
      {listas.map(([k, filas]) => (
        <div key={k} style={{ ...caja, overflowX: 'auto' }}>
          <h4 style={{ marginTop: 0 }}>{etiqueta(k)}</h4>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '420px' }}>
            <thead><tr>{Object.keys(filas[0]).map((c) => <th key={c} style={{ textAlign: 'left', padding: '6px 10px', fontSize: '13px' }}>{etiqueta(c)}</th>)}</tr></thead>
            <tbody>{filas.slice(0, 15).map((f, i) => <tr key={i}>{Object.values(f).map((v, j) => <td key={j} style={{ padding: '6px 10px', borderTop: '1px solid #f1d5d5', fontSize: '14px' }}>{String(v)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      ))}
      {!kpis && <p>Cargando…</p>}
    </div>
  );
};
export default Direccion;
