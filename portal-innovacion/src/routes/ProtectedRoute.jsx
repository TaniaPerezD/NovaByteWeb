import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { logoutSupabase } from '../services/authService';

// El rol que manda es el del servidor (RPC estado_sesion, protegida por la sesión real), no el que
// esté escrito en localStorage. Si una paciente aún no aceptó los términos vigentes (NB-CON-P6-03),
// se la lleva a /terminos antes de dejarla usar la app.
const ProtectedRoute = ({ children, allow = ['paciente', 'medico', 'medicoAdmin'] }) => {
  const [estado, setEstado] = useState('cargando'); // cargando | ok | sin-sesion | sin-permiso | terminos | consentimientos
  const permitidos = allow.join(',');

  useEffect(() => {
    let activo = true;

    (async () => {
      try {
        const { data: sesion } = await supabase.auth.getSession();
        if (!sesion?.session) {
          localStorage.removeItem('nb-user');
          if (activo) setEstado('sin-sesion');
          return;
        }

        const { data: est, error } = await supabase.rpc('estado_sesion');
        if (!activo) return;

        if (error || !est?.valida || est.bloqueado === true || est.activo === false) {
          localStorage.removeItem('nb-user');
          setEstado('sin-sesion');
          return;
        }

        try {
          const local = JSON.parse(localStorage.getItem('nb-user') || '{}');
          localStorage.setItem('nb-user', JSON.stringify({ ...local, rol: est.rol, perfil_id: sesion.session.user.id }));
        } catch (e) {
          // si el valor local estaba corrupto, no pasa nada: manda el servidor
        }

        if (est.reauth_pendiente) {
          // límite de consultas superado (NB-POL-P6-06): se pide confirmar la identidad con un código nuevo
          try { sessionStorage.setItem('nb-aviso-signin', 'Por seguridad, confirma tu identidad de nuevo: inicia sesión con un código nuevo.'); } catch (e) { /* sin aviso */ }
          await logoutSupabase();
          if (activo) setEstado('sin-sesion');
          return;
        }

        if (est.terminos_pendientes) {
          setEstado('terminos');
          return;
        }
        if (est.consentimiento_pendiente) {
          setEstado('consentimientos');
          return;
        }
        setEstado(permitidos.split(',').includes(est.rol) ? 'ok' : 'sin-permiso');
      } catch (e) {
        if (activo) setEstado('sin-sesion');
      }
    })();

    return () => {
      activo = false;
    };
  }, [permitidos]);

  if (estado === 'cargando') return null;
  if (estado === 'sin-sesion') return <Navigate to="/signin" replace />;
  if (estado === 'terminos') return <Navigate to="/terminos" replace />;
  if (estado === 'consentimientos') return <Navigate to="/consentimientos" replace />;
  if (estado === 'sin-permiso') return <Navigate to="/" replace />;
  return children;
};

export default ProtectedRoute;
