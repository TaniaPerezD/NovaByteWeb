import React, { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { matrizPermisos, matrizEstado, personalLista, reasignarRol, ROLES, MODULOS } from '../../services/rolesService';

const celda = { padding: '8px 10px', borderBottom: '1px solid #f1d5d5', fontSize: '13px', textAlign: 'left', verticalAlign: 'top' };
const caja = { background: 'white', border: '1px solid #f1d5d5', borderRadius: '10px', padding: '14px 18px', marginBottom: '14px', overflowX: 'auto' };
const tarjeta = { background: 'white', border: '1px solid #f1d5d5', borderRadius: '10px', padding: '10px 16px', minWidth: '140px' };

// Matriz de roles y permisos (NB-MAT-P3-07) con su indicador de cumplimiento.
const MatrizRoles = () => {
  const [filas, setFilas] = useState([]);
  const [estado, setEstado] = useState(null);
  const [personal, setPersonal] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setFilas(await matrizPermisos());
      try { setEstado(await matrizEstado()); } catch (e) { setEstado(null); }
      try { setPersonal(await personalLista()); } catch (e) { setPersonal(null); }
    } catch (e) { Swal.fire({ icon: 'error', title: 'No se pudo cargar', text: e.message }); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const roles = [...new Map(filas.map((f) => [f.rol, f])).values()];
  const celdaDe = (rol, modulo) => (filas.find((f) => f.rol === rol && f.modulo === modulo) || {}).permiso || '';

  const reasignar = async (p) => {
    const r = await Swal.fire({
      title: `Reasignar a ${p.nombre}`, input: 'select', inputOptions: Object.fromEntries(Object.entries(ROLES).filter(([k]) => k !== 'paciente' && k !== 'medicoAdmin')),
      inputPlaceholder: 'Elige el rol nuevo', showCancelButton: true, confirmButtonText: 'Siguiente', cancelButtonText: 'Cancelar',
      inputValidator: (v) => (!v ? 'Elige un rol' : undefined),
    });
    if (!r.isConfirmed) return;
    const m = await Swal.fire({ title: 'Motivo del cambio', input: 'text', showCancelButton: true, confirmButtonText: 'Reasignar', cancelButtonText: 'Cancelar', inputValidator: (v) => (!v || v.trim().length < 5 ? 'Escribe el motivo' : undefined) });
    if (!m.isConfirmed) return;
    try { await reasignarRol(p.id, r.value, m.value); await cargar(); } catch (e) { Swal.fire({ icon: 'error', title: 'No se pudo reasignar', text: e.message }); }
  };

  return (
    <div style={{ padding: '8px 4px' }}>
      {estado && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div style={tarjeta}><b style={{ fontSize: '24px' }}>{estado.porcentaje}%</b><div>Cuentas conformes con la matriz</div></div>
          <div style={tarjeta}><b style={{ fontSize: '24px' }}>{estado.cuentas_activas}</b><div>Cuentas activas</div></div>
          <div style={tarjeta}><b style={{ fontSize: '24px' }}>{estado.con_rol_heredado}</b><div>Con rol heredado por reasignar</div></div>
        </div>
      )}
      <div style={caja}>
        <h4 style={{ marginTop: 0 }}>Matriz de roles y permisos</h4>
        <p style={{ fontSize: '13px', color: '#6b6b6b' }}>L lectura · E escritura · B borrado · X denegado. Todo lo que no está permitido está denegado.</p>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '760px' }}>
          <thead><tr><th style={celda}>Rol</th>{Object.entries(MODULOS).map(([k, v]) => <th key={k} style={celda}>{v}</th>)}</tr></thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.rol} style={r.heredado ? { background: '#fff6e5' } : undefined}>
                <td style={celda}><b>{r.nombre}</b></td>
                {Object.keys(MODULOS).map((m) => <td key={m} style={celda}>{celdaDe(r.rol, m)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {personal && (
        <div style={caja}>
          <h4 style={{ marginTop: 0 }}>Personal y reasignación de roles</h4>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '520px' }}>
            <thead><tr><th style={celda}>Nombre</th><th style={celda}>Correo</th><th style={celda}>Rol</th><th style={celda}></th></tr></thead>
            <tbody>
              {personal.map((p) => (
                <tr key={p.id}>
                  <td style={celda}>{p.nombre}</td><td style={celda}>{p.email}</td><td style={celda}>{ROLES[p.rol] || p.rol}</td>
                  <td style={celda}><button type="button" className="ed-btn" style={{ padding: '4px 10px', fontSize: '13px' }} onClick={() => reasignar(p)}>Reasignar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default MatrizRoles;
