import { useEffect } from 'react';
import Swal from 'sweetalert2';
import { supabase } from '../../services/supabaseClient';
import { logoutSupabase } from '../../services/authService';

// Control de sesiones (NB-POL-P6-02, sección 6.6): cierre por inactividad a los 10 minutos.
// El servidor aplica lo mismo (10 min sin latido y 12 h de duración máxima), así que aunque
// alguien manipule este código en el navegador, la base de datos deja de responder igual.
const INACTIVIDAD_MS = 10 * 60 * 1000;
const LATIDO_MS = 60 * 1000;
const REVISION_MS = 20 * 1000;
const EVENTOS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

const ControlSesion = () => {
  useEffect(() => {
    let ultimaActividad = Date.now();
    let ultimoLatido = 0;
    let cerrando = false;

    const marcar = () => { ultimaActividad = Date.now(); };
    EVENTOS.forEach((e) => window.addEventListener(e, marcar, { passive: true }));

    const expirar = async (texto) => {
      if (cerrando) return;
      cerrando = true;
      await logoutSupabase();
      await Swal.fire({ icon: 'info', title: 'Sesión cerrada', text: texto, confirmButtonText: 'Entendido' });
      window.location.assign('/signin');
    };

    const revisar = async () => {
      if (cerrando) return;
      const { data } = await supabase.auth.getSession();
      if (!data?.session) return; // sin sesión no hay nada que vigilar

      const ahora = Date.now();
      if (ahora - ultimaActividad > INACTIVIDAD_MS) {
        await expirar('Por seguridad, tu sesión se cerró tras 10 minutos sin actividad.');
        return;
      }
      // Latido: solo si hubo actividad desde el último, para que el servidor mida la inactividad real.
      if (ultimaActividad > ultimoLatido && ahora - ultimoLatido >= LATIDO_MS) {
        ultimoLatido = ahora;
        const { error } = await supabase.rpc('latido');
        if (error && (error.code === '42501' || /expirad/i.test(error.message || ''))) {
          await expirar('Tu sesión expiró. Vuelve a iniciar sesión.');
        }
      }
    };

    revisar();
    const timer = setInterval(revisar, REVISION_MS);
    return () => {
      clearInterval(timer);
      EVENTOS.forEach((e) => window.removeEventListener(e, marcar));
    };
  }, []);

  return null;
};

export default ControlSesion;
