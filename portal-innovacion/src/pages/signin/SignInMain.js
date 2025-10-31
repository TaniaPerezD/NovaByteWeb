// src/pages/signin/SignInMain.js
import React from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import RightArrow from '../../components/SVG';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

import signInImg from '../../assets/img/contact/signin.jpg';
import { useForm } from '../../hooks/useForm';
import validator from 'validator';
import Swal from 'sweetalert2';
import { loginStep1 } from '../../services/authService';
import { useNavigate, Link } from 'react-router-dom';

const SignInMain = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  // tu forma original
  const [formValues, handleInputChange] = useForm({
    email: '',
    password: '',
  });
  const { email, password } = formValues;

  // ahora sí: solo validamos correo
  const isFormValid = () => {
    if (!validator.isEmail(email)) {
      Swal.fire({
        icon: 'error',
        title: 'Correo inválido',
        text: 'Ingresa un correo electrónico válido.',
        confirmButtonColor: '#E79796',
      });
      return false;
    }
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setLoading(true);
    try {
      const resp = await loginStep1(email, password);

      // caso: primer login → mandamos a crear contraseña
      if (resp && resp.firstTime) {
        await Swal.fire({
          icon: 'info',
          title: 'Necesitas crear tu contraseña',
          html: `
            Te enviamos un enlace a <b>${email}</b> para que crees tu contraseña por primera vez.<br/>
            Revisa tu correo (también spam).
          `,
          confirmButtonColor: '#E79796',
        });
        return;
      }

      // caso normal → 2do paso
      await Swal.fire({
        icon: 'success',
        title: 'Código enviado',
        text: 'Te enviamos un código de verificación a tu correo.',
        confirmButtonColor: '#E79796',
      });

      navigate(`/two-verification?email=${encodeURIComponent(email)}`);
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo iniciar sesión',
        text: err.message || 'Revisa tu correo y contraseña',
        confirmButtonColor: '#E79796',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <Breadcrumb title="Inicio de Sesión" />

      <div className="it-signup-area pt-120 pb-120">
        <div className="container">
          {/* wrapper responsive */}
          <div
            className="it-signup-bg p-relative"
            style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}
          >
            {/* imagen (solo lg+) */}
            <div
              className="it-signup-thumb d-none d-lg-block"
              style={{ flex: '1 1 40%', minWidth: '280px' }}
            >
              <img
                src={signInImg}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* formulario */}
            <div
              className="row"
              style={{ flex: '1 1 50%', minWidth: '280px', margin: 0 }}
            >
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                <form onSubmit={handleLogin}>
                  <div className="it-signup-wrap">
                    <h4 className="it-signup-title">Iniciar Sesión</h4>
                    <div className="it-signup-input-wrap">
                      {/* email */}
                      <div className="it-signup-input mb-20">
                        <input
                          type="email"
                          placeholder="Correo Electrónico"
                          name="email"
                          autoComplete="off"
                          value={email}
                          onChange={handleInputChange}
                          data-testid="email-input"
                        />
                      </div>

                      {/* password con ojito ya centrado */}
                      <div className="it-signup-input mb-20">
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Contraseña (si ya tienes)"
                            name="password"
                            value={password}
                            onChange={handleInputChange}
                            style={{ paddingRight: '40px' }}
                            data-testid="password-input"
                          />

                          <span
                            onClick={() => setShowPassword((prev) => !prev)}
                            style={{
                              position: 'absolute',
                              right: '16px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              cursor: 'pointer',
                              color: '#7F8D9D',
                            }}
                            aria-label={
                              showPassword
                                ? 'Ocultar contraseña'
                                : 'Mostrar contraseña'
                            }
                          >
                            {showPassword ? (
                              <FaEyeSlash size={18} />
                            ) : (
                              <FaEye size={18} />
                            )}
                          </span>
                        </div>
                        <small
                          style={{
                            color: '#999',
                            fontSize: '12px',
                            display: 'block',
                            marginTop: '4px',
                          }}
                        >
                          Si es tu primera vez, puedes dejarla vacía.
                        </small>
                      </div>
                    </div>

                    <div className="it-signup-btn d-sm-flex justify-content-between align-items-center mb-40">
                      <button
                        type="submit"
                        className="ed-btn-theme"
                        disabled={loading}
                        data-testid="login-button"
                      >
                        {loading ? 'Enviando...' : 'Ingresar'}
                        {!loading && (
                          <i>
                            <RightArrow />
                          </i>
                        )}
                      </button>
                      <Link
                        to="/reset-password"
                        className="it-signup-forgot"
                        style={{ color: '#E79796' }}
                      >
                        ¿Olvidaste tu contraseña?
                      </Link>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            {/* fin formulario */}
          </div>
        </div>
      </div>
    </main>
  );
};

export default SignInMain;