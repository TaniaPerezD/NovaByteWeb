// src/pages/two-verification/TwoVerificationMain.js
import React, { useState, useRef } from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import Swal from 'sweetalert2';
import { useLocation, useNavigate } from 'react-router-dom';
import { loginStep2, loginStep1 } from '../../services/authService';
import signInImg from '../../assets/img/contact/signin.jpg';
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

      // resp debería venir así:
      // { ok: true, rol: 'paciente' | 'medico', nombre: '...', email: '...' }

      // guardamos en localStorage
      localStorage.setItem(
        'nb-user',
        JSON.stringify({
          email: resp.email,
          rol: resp.rol,
          nombre: resp.nombre,
        })
      );

      // decidir ruta
      let destino = '/';
      if (resp.rol === 'medico') {
        destino = '/medico';
      } else if (resp.rol === 'paciente') {
        destino = '/paciente';
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
    try {
      await loginStep1(emailFromQuery, '___dummy___'); // el step1 espera email y password, pero tú en el front real lo vas a hacer desde el login
      Swal.fire({
        icon: 'info',
        title: 'Código reenviado',
        text: 'Te hemos enviado un nuevo código de verificación.',
      });
    } catch (err) {
      // si no quieres reenviar desde aquí, puedes dejar solo el swal anterior
      Swal.fire({
        icon: 'error',
        title: 'No se pudo reenviar',
        text: 'Intenta otra vez desde el inicio de sesión.',
      });
    }
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
                          style={{
                            width: '50px',
                            height: '58px',
                            border: '1px solid #ccc',
                            borderRadius: '10px',
                            textAlign: 'center',
                            fontSize: '22px',
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