import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutSupabase } from '../../services/authService';
import { ROLES } from '../../services/rolesService';

// Roles técnicos (desarrollador, DBA, infraestructura, ML): la matriz NB-MAT-P3-07 les da X en todos los módulos de la app.
const SinModulos = () => {
  const navigate = useNavigate();
  let rol = '';
  try { rol = JSON.parse(localStorage.getItem('nb-user') || '{}').rol || ''; } catch (e) { /* sin rol local */ }
  const salir = async () => { await logoutSupabase(); navigate('/signin'); };
  return (
    <div style={{ maxWidth: '560px', margin: '90px auto', padding: '0 16px', textAlign: 'center' }}>
      <h2>Sin módulos en la aplicación</h2>
      <p>
        Tu rol{rol ? ` (${ROLES[rol] || rol})` : ''} no tiene acceso a la agenda, al expediente, a las imágenes ni a la analítica.
        Tu trabajo se hace sobre la infraestructura, no sobre los datos de las pacientes.
      </p>
      <p style={{ color: '#6b6b6b', fontSize: '14px' }}>
        Si necesitas un acceso extraordinario, el Jefe del Área de TI lo solicita y el Director General lo firma por un máximo de 24 horas (NB-MAT-P3-07, sección 9).
      </p>
      <button type="button" className="ed-btn" onClick={salir} style={{ marginTop: '12px' }}>Cerrar sesión</button>
    </div>
  );
};
export default SinModulos;
