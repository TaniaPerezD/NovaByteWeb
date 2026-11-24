// src/pages/two-verification/TwoVerificationMain.js
import React, { useState, useRef } from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import Swal from 'sweetalert2';
import { useLocation, useNavigate } from 'react-router-dom';
import { loginStep2 } from '../../services/authService';
import { supabase } from '../../services/supabaseClient';
import signInImg from '../../assets/img/contact/verificaciondospasos.jpg';
import phoneIcon from '../../assets/img/class/phone.png';

const TwoVerificationCodeMain = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  // viene del /signin?email=...
  const emailFromQuery = params.get('email') || '';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputsRef = useRef([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (/^\d?$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      if (value && index < 5) {
        inputsRef.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && code[index] === '' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1) validar 6 dígitos
    if (code.some((d) => d === '')) {
      Swal.fire({
        icon: 'error',
        title: 'Código incompleto',
        text: 'Por favor ingresa los 6 dígitos.',
      });
      return;
    }

    // 2) verificar que sí tenemos email
    if (!emailFromQuery) {
      Swal.fire({
        icon: 'warning',
        title: 'Sesión incompleta',
        text: 'Vuelve a iniciar sesión para obtener un código.',
      }).then(() => navigate('/signin'));
      return;
    }

    setLoading(true);
    try {
      // 👇 aquí ya NO vamos al rest/v1/perfil
      // porque el edge login-step2 ya devuelve rol, nombre, email
      const resp = await loginStep2(emailFromQuery, code.join(''));

      // resp viene así:
      // { ok: true, rol: 'paciente' | 'medico', nombre: '...', email: '...', token_hash: '...' }

      // login-step2 ya no devuelve una sesión: entrega un token_hash que hay que
      // canjear aquí para obtener la sesión real de Supabase. Sin sesión, auth.uid()
      // es null y las políticas RLS no devuelven ningún dato.
      if (!resp.token_hash) {
        throw new Error('El servidor no devolvió datos de sesión. Intenta de nuevo.');
      }
      let sessionData;
      let otpError;
      for (const type of ['magiclink', 'email']) {
        ({ data: sessionData, error: otpError } = await supabase.auth.verifyOtp({
          token_hash: resp.token_hash,
          type,
        }));
        if (!otpError && sessionData?.session) break;
      }
      if (otpError || !sessionData?.session) {
        throw new Error('No se pudo iniciar la sesión. Vuelve a intentarlo.');
      }

      // guardamos en localStorage (el id del perfil es el id del usuario de auth)
      localStorage.setItem(
        'nb-user',
        JSON.stringify({
          email: resp.email,
          rol: resp.rol,
          nombre: resp.nombre,
          perfil_id: sessionData.user.id,
        })
      );

      // decidir ruta
      let destino = '/';
      if (resp.rol === 'medico') {
        destino = '/medico';
      } else if (resp.rol === 'paciente') {
        destino = '/paciente';
      } else if (resp.rol === 'medicoAdmin') {
        destino = '/medico-admin';
      }

      await Swal.fire({
        icon: 'success',
        title: 'Código verificado',
        text: 'Tu identidad ha sido confirmada.',
        timer: 1400,
        showConfirmButton: false,
      });

      navigate(destino);
    } catch (error) {
      // si el fetch del servicio lanzó un error con message
      Swal.fire({
        icon: 'error',
        title: 'Error al verificar',
        text: error.message || 'Ocurrió un error al verificar el código.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!emailFromQuery) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin correo',
        text: 'Vuelve a iniciar sesión para reenviar el código.',
      });
      return;
    }
    // Un código nuevo solo se genera después de verificar la contraseña (login-step1),
    // y aquí ya no la tenemos. Por eso se pide volver a iniciar sesión.
    await Swal.fire({
      icon: 'info',
      title: 'Solicita un código nuevo',
      text: 'Por seguridad, vuelve a iniciar sesión con tu contraseña para recibir un código nuevo.',
      confirmButtonText: 'Ir a iniciar sesión',
    });
    navigate('/signin');
  };

  const handleBack = () => {
    navigate('/signin');
  };

  return (
    <main>
      <Breadcrumb title="Verificación en Dos Pasos" />

      <div className="it-signup-area pt-120 pb-120" style={{ background: '#FFF5F5' }}>
        <div className="container">
          <div className="it-signup-bg p-relative" style={{ background: '#FFF5F5' }}>
            <div className="row">
              {/* IZQUIERDA */}
              <div className="col-xl-6 col-lg-6">
                <form onSubmit={handleSubmit}>
                  <div className="it-signup-wrap" style={{ padding: '40px' }}>
                    <h4
                      className="it-signup-title d-flex align-items-center gap-3"
                      style={{ fontWeight: '700', marginBottom: '20px' }}
                    >
                      <img src={phoneIcon} alt="phone icon" style={{ width: '32px', height: '32px' }} />
                      INGRESAR CÓDIGO
                    </h4>
                    <p className="it-signup-subtitle" style={{ marginBottom: '30px' }}>
                      Ingresa el código de 6 dígitos enviado a tu correo electrónico
                    </p>

                    {/* inputs de 6 dígitos */}
                    <div className="d-flex justify-content-start gap-3 mb-3">
                      {code.map((digit, index) => (
                        <input
                          key={index}
                          type="text"
                          maxLength="1"
                          value={digit}
                          onChange={(e) => handleChange(e, index)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          ref={(el) => (inputsRef.current[index] = el)}
                          data-testid={`2fa-input-${index}`}
                          style={{
                            width: '70px',
                            height: '68px',
                            border: '1px solid #ccc',
                            borderRadius: '10px',
                            textAlign: 'center',
                            fontSize: '18px',
                            fontWeight: '600',
                            backgroundColor: 'white',
                            outline: 'none',
                          }}
                        />
                      ))}
                    </div>

                    {/* reenviar */}
                    <div className="text-start mb-4">
                      <a
                        href="/"
                        onClick={handleResend}
                        data-testid="resend-button"
                        style={{
                          color: '#E9B0A3',
                          fontWeight: '600',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                        }}
                      >
                        Reenviar código
                      </a>
                    </div>

                    {/* botones */}
                    <div className="d-flex justify-content-start align-items-center gap-4 mt-4">
                      <button
                        type="button"
                        onClick={handleBack}
                        style={{
                          background: '#FBECEC',
                          border: '1px solid #E9B0A3',
                          color: '#E9B0A3',
                          fontWeight: '600',
                          borderRadius: '12px',
                          height: '52px',
                          width: '160px',
                          cursor: 'pointer',
                        }}
                      >
                        Volver
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        data-testid="verify-button"
                        style={{
                          background: '#E9B0A3',
                          border: 'none',
                          color: 'white',
                          fontWeight: '600',
                          borderRadius: '12px',
                          height: '52px',
                          width: '160px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          opacity: loading ? 0.7 : 1,
                          
                        }}
                      >
                        {loading ? 'Verificando...' : 'Siguiente'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* DERECHA */}
              <div className="col-xl-6 col-lg-6 d-none d-lg-block">
                <div className="it-signup-thumb">
                  <img src={signInImg} alt="" style={{ width: '100%', borderRadius: '8px' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default TwoVerificationCodeMain;