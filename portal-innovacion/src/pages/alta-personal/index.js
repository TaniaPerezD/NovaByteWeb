import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { supabase } from '../../services/supabaseClient';
import { altaPersonal, ROLES } from '../../services/rolesService';

const caja = { background: 'white', border: '1px solid #f1d5d5', borderRadius: '10px', padding: '14px 18px', marginBottom: '14px', maxWidth: '560px' };
const campo = { display: 'block', width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e5c8c8', marginBottom: '8px' };
const ROLES_SOPORTE = ['medico', 'recepcion', 'desarrollador', 'dba', 'infra', 'ml'];
const ROLES_ADMIN = ['medico', 'recepcion', 'director', 'soporte', 'desarrollador', 'dba', 'infra', 'ml', 'osi', 'medicoAdmin'];

// Alta de personal con los roles de la matriz NB-MAT-P3-07 (NB-PRO-P3-01). El servidor decide qué roles puede asignar quien llama.
const AltaPersonal = () => {
  const [miRol, setMiRol] = useState('');
  const [f, setF] = useState({ nombre: '', apellidos: '', email: '', fecha_nacimiento: '', rol: 'recepcion', especialidad: '' });
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => { supabase.rpc('mi_rol').then(({ data }) => setMiRol(data || '')); }, []);
  const roles = miRol === 'medicoAdmin' ? ROLES_ADMIN : ROLES_SOPORTE;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setOcupado(true);
    try {
      const r = await altaPersonal({ ...f, especialidad: f.rol === 'medico' || f.rol === 'medicoAdmin' ? f.especialidad : undefined });
      await Swal.fire({ icon: 'success', title: 'Cuenta creada', text: r.message });
      setF({ ...f, nombre: '', apellidos: '', email: '', fecha_nacimiento: '', especialidad: '' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo crear', text: err.message });
    } finally { setOcupado(false); }
  };

  return (
    <div style={{ padding: '8px 4px' }}>
      <div style={caja}>
        <h4 style={{ marginTop: 0 }}>Alta de personal</h4>
        <p style={{ fontSize: '14px', color: '#6b6b6b' }}>La persona recibe un correo de primer acceso. Su rol define lo que puede ver, según la matriz de roles.</p>
        <form onSubmit={enviar}>
          <label htmlFor="ap-nom">Nombre</label><input id="ap-nom" style={campo} required value={f.nombre} onChange={set('nombre')} />
          <label htmlFor="ap-ape">Apellidos</label><input id="ap-ape" style={campo} required value={f.apellidos} onChange={set('apellidos')} />
          <label htmlFor="ap-mail">Correo</label><input id="ap-mail" type="email" style={campo} required value={f.email} onChange={set('email')} />
          <label htmlFor="ap-fn">Fecha de nacimiento</label><input id="ap-fn" type="date" style={campo} required value={f.fecha_nacimiento} onChange={set('fecha_nacimiento')} />
          <label htmlFor="ap-rol">Rol</label>
          <select id="ap-rol" style={campo} value={f.rol} onChange={set('rol')}>{roles.map((r) => <option key={r} value={r}>{ROLES[r]}</option>)}</select>
          {(f.rol === 'medico' || f.rol === 'medicoAdmin') && (<><label htmlFor="ap-esp">Especialidad</label><input id="ap-esp" style={campo} required value={f.especialidad} onChange={set('especialidad')} /></>)}
          <button type="submit" className="ed-btn" disabled={ocupado}>{ocupado ? 'Creando…' : 'Crear cuenta'}</button>
        </form>
      </div>
    </div>
  );
};
export default AltaPersonal;
