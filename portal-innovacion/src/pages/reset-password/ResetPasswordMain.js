import React, { useState } from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import signInImg from '../../assets/img/contact/signin.jpg';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router';
import validator from 'validator';
import { useForm } from '../../hooks/useForm';
import { sendResetPassword } from '../../services/authService';

const ResetPasswordMain = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formValues, handleInputChange, reset] = useForm({ email: '' });
  const { email } = formValues;

  const handleReset = async (e) => {
    e.preventDefault();

    // 1. vacío
    if (email.trim() === '') {
      Swal.fire({
        icon: 'error',
        title: 'Falta el correo',
        text: 'Ingresa tu correo para continuar.',
        confirmButtonColor: '#E79796',
      });
      return;
    }

    // 2. formato
    if (!validator.isEmail(email)) {
      Swal.fire({
        icon: 'error',
        title: 'Correo no válido',
        text: 'Revisa que esté bien escrito (ejemplo@dominio.com).',
        confirmButtonColor: '#E79796',
      });
      return;
    }

    try {
      setLoading(true);

      // 3. llamar a tu edge: /forgot-password
      await sendResetPassword(email);

      Swal.fire({
        icon: 'success',
        title: 'Correo enviado',
        html: `
          <p style="margin-bottom:6px;">Hemos enviado un enlace de recuperación a:</p>
          <p style="margin:0;"><strong>email:</strong> ${email}</p>
          <p style="margin-top:10px;font-size:12px;color:#6b7280;">
            Si no lo ves en tu bandeja, revisa Spam o Promociones.
          </p>
        `,
        confirmButtonColor: '#E79796',
      }).then(() => {
        // si quieres que vuelva al login:
        navigate('/signin');
      });

      reset();
    } catch (err) {
      console.error(err);
      // si es CORS o la función no devolvió bien
      Swal.fire({
        icon: 'error',
        title: 'No se pudo enviar',
        text:
          err?.message === 'Failed to fetch'
            ? 'No pudimos contactar al servidor. Revisa que la función tenga el CORS correcto.'
            : err.message || 'Hubo un problema al enviar el correo de recuperación.',
        confirmButtonColor: '#E79796',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/signin');
  };

  return (
    <main>
      <Breadcrumb title="Recuperar Contraseña" />

      <div className="it-signup-area pt-120 pb-120">
        <div className="container">
          <div className="it-signup-bg p-relative">
            <div className="it-signup-thumb d-none d-lg-block">
              <img src={signInImg} alt="" />
            </div>
            <div className="row">
              <div className="col-xl-6 col-lg-6">
                <form onSubmit={handleReset}>
                  <div className="it-signup-wrap">
                    <h4
                      className="it-signup-title"
                      style={{ fontSize: '40px' }}
                    >
                      Recuperar Contraseña
                    </h4>
                    <p className="it-signup-subtitle">
                      Ingresa tu correo para recibir el enlace de recuperación
                    </p>
                    <div className="it-signup-input-wrap">
                      <div className="it-signup-input mb-20">
                        <label
                          htmlFor="email"
                          style={{
                            display: 'block',
                            marginBottom: '6px',
                            fontWeight: 500,
                            color: '#4E5865',
                          }}
                        >
                          Correo electrónico
                        </label>
                        <input
                          id="email"
                          type="email"
                          name="email"
                          value={email}
                          onChange={handleInputChange}
                          placeholder="ejemplo@correo.com"
                          autoComplete="off"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div
                      className="it-signup-btn d-flex flex-column align-items-center gap-3 mb-40"
                      style={{ width: '100%' }}
                    >
                      <button
                        type="submit"
                        className="ed-btn-theme w-100"
                        style={{
                          background: '#E79796',
                          borderColor: '#E79796',
                          color: 'white',
                          fontWeight: '500',
                          fontSize: '20px',
                          borderRadius: '8px',
                          padding: '10px 0',
                          textAlign: 'center',
                          letterSpacing: '0.2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          opacity: loading ? 0.8 : 1,
                          cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                        disabled={loading}
                      >
                        {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                      </button>
                      <button
                        type="button"
                        onClick={handleBack}
                        className="ed-btn-outline w-100"
                        style={{
                          background: '#DEE2E6',
                          color: '#E79796',
                          fontWeight: '500',
                          fontSize: '20px',
                          borderRadius: '8px',
                          padding: '10px 0',
                          textAlign: 'center',
                          letterSpacing: '0.2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                        disabled={loading}
                      >
                        <span style={{ fontSize: '18px', lineHeight: '1' }}>
                          ←
                        </span>{' '}
                        Volver al inicio de sesión
                      </button>
                    </div>
                  </div>
                </form>
              </div>
              {/* derecha vacía, como lo tenías */}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ResetPasswordMain;