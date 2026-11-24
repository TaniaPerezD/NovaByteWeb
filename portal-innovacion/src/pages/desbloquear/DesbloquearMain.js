import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import validator from 'validator';
import Breadcrumb from '../../components/Breadcrumb';
import signInImg from '../../assets/img/contact/imag1.jpg';
import { solicitarDesbloqueo, confirmarDesbloqueo } from '../../services/authService';

const botonEstilo = (loading) => ({
  background: '#E79796',
  borderColor: '#E79796',
  color: 'white',
  fontWeight: '500',
  fontSize: '20px',
  borderRadius: '8px',
  padding: '10px 0',
  textAlign: 'center',
  letterSpacing: '0.2px',
  opacity: loading ? 0.8 : 1,
  cursor: loading ? 'not-allowed' : 'pointer',
});

// Dos usos en la misma pantalla (NB-POL-P6-02):
//  - /desbloquear                 -> la paciente pide el enlace con su correo
//  - /desbloquear?token=...       -> confirma el enlace del correo (30 minutos, un solo uso)
const DesbloquearMain = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [estado, setEstado] = useState(token ? 'verificando' : 'formulario'); // verificando | ok | error | formulario | enviado
  const [mensaje, setMensaje] = useState('');
  const yaConfirmado = useRef(false); // evita usar el enlace dos veces (React.StrictMode ejecuta el efecto 2 veces en desarrollo)

  useEffect(() => {
    if (!token || yaConfirmado.current) return;
    yaConfirmado.current = true;
    (async () => {
      try {
        const r = await confirmarDesbloqueo(token);
        setMensaje(r.message || 'Cuenta desbloqueada. Ya puedes iniciar sesión.');
        setEstado('ok');
      } catch (err) {
        setMensaje(err.message || 'El enlace no es válido, ya se usó o expiró.');
        setEstado('error');
      }
    })();
  }, [token]);

  const handleSolicitar = async (e) => {
    e.preventDefault();
    if (!validator.isEmail(email.trim())) {
      Swal.fire({ icon: 'warning', title: 'Correo inválido', text: 'Escribe un correo electrónico válido.' });
      return;
    }
    try {
      setLoading(true);
      const r = await solicitarDesbloqueo(email.trim());
      setMensaje(r.message || 'Si la cuenta existe y está bloqueada, enviamos un enlace a su correo.');
      setEstado('enviado');
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo enviar', text: err.message || 'Inténtalo de nuevo en unos minutos.' });
    } finally {
      setLoading(false);
    }
  };

  const titulo = token ? 'Desbloquear cuenta' : 'Cuenta bloqueada';

  return (
    <main>
      <Breadcrumb title="Desbloquear cuenta" />

      <div className="it-signup-area pt-120 pb-120">
        <div className="container">
          <div className="it-signup-bg p-relative">
            <div className="it-signup-thumb d-none d-lg-block">
              <img src={signInImg} alt="" />
            </div>
            <div className="row">
              <div className="col-xl-6 col-lg-6">
                <div className="it-signup-wrap">
                  <h4 className="it-signup-title" style={{ fontSize: '40px' }}>{titulo}</h4>

                  {estado === 'verificando' && (
                    <p className="it-signup-subtitle">Verificando el enlace…</p>
                  )}

                  {(estado === 'ok' || estado === 'error' || estado === 'enviado') && (
                    <>
                      <p className="it-signup-subtitle" role="status" style={{ color: estado === 'error' ? '#b42318' : undefined }}>
                        {mensaje}
                      </p>
                      <div className="mb-40">
                        <Link to="/signin" className="ed-btn-theme w-100" style={{ ...botonEstilo(false), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          Ir a iniciar sesión
                        </Link>
                        {estado === 'error' && (
                          <p style={{ marginTop: '12px', textAlign: 'center' }}>
                            <Link to="/desbloquear" style={{ color: '#E79796', fontWeight: 500 }}>Pedir un enlace nuevo</Link>
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {estado === 'formulario' && (
                    <form onSubmit={handleSolicitar}>
                      <p className="it-signup-subtitle">
                        Tu cuenta se bloquea tras tres intentos fallidos. Escribe tu correo y te enviaremos un enlace para desbloquearla.
                        El enlace vence en 30 minutos y solo se puede usar una vez.
                      </p>
                      <div className="it-signup-input-wrap">
                        <div className="it-signup-input mb-20">
                          <label htmlFor="email" style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#4E5865' }}>
                            Correo electrónico
                          </label>
                          <input
                            id="email"
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ejemplo@correo.com"
                            autoComplete="off"
                            disabled={loading}
                          />
                        </div>
                      </div>
                      <div className="it-signup-btn d-flex flex-column align-items-center gap-3 mb-40" style={{ width: '100%' }}>
                        <button type="submit" className="ed-btn-theme w-100" style={botonEstilo(loading)} disabled={loading}>
                          {loading ? 'Enviando...' : 'Enviar enlace de desbloqueo'}
                        </button>
                        <Link to="/signin" style={{ color: '#E79796', fontWeight: 500 }}>Volver a iniciar sesión</Link>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default DesbloquearMain;
