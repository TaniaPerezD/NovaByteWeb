import React from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import RightArrow from '../../components/SVG';

import signInImg from '../../assets/img/contact/signin.jpg';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router';
import validator from 'validator';
import { useForm } from '../../hooks/useForm';

const ResetPasswordMain = () => {
  const navigate = useNavigate();

  const [formValues, handleInputChange, reset] = useForm({ email: '' });
  const { email } = formValues;

  const handleReset = (e) => {
    e.preventDefault();
    if (email.trim() === '') {
      Swal.fire({
        icon: 'error',
        title: 'Ooops...',
        text: 'Ingresa tu correo para continuar',
      });
      return;
    }
    if (!validator.isEmail(email)) {
      Swal.fire({
        icon: 'error',
        title: 'Ooops...',
        text: 'Correo electrónico inválido',
      });
      return;
    }
    Swal.fire({
      icon: 'success',
      title: 'Correo enviado',
      text: 'Hemos enviado un enlace de recuperación a tu correo.',
    });
    reset();
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
                    <h4 className="it-signup-title">Recuperar Contraseña</h4>
                    <p className="it-signup-subtitle">Ingresa tu correo para recibir el enlace de recuperación</p>
                    <div className="it-signup-input-wrap">
                      <div className="it-signup-input mb-20">
                        <input
                          type="email"
                          name="email"
                          value={email}
                          onChange={handleInputChange}
                          placeholder="Correo Electrónico"
                          autoComplete="off"
                        />
                      </div>
                    </div>
                    <div className="it-signup-btn d-flex flex-column gap-3 align-items-start mb-40" style={{ width: '100%' }}>
                      <button
                        type="submit"
                        className="ed-btn-theme w-100"
                        style={{
                          background: '#E79796',
                          borderColor: '#E79796',
                          color: 'white',
                          fontWeight: '600',
                          borderRadius: '8px',
                          padding: '12px 0',
                        }}
                      >
                        Enviar enlace de recuperación
                      </button>
                      <button
                        type="button"
                        onClick={handleBack}
                        className="ed-btn-outline w-100"
                        style={{
                          background: '#E9EDF4',
                          color: '#E79796',
                          fontWeight: '600',
                          borderRadius: '8px',
                          padding: '12px 0',
                        }}
                      >
                        ← Volver al inicio de sesión
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ResetPasswordMain;
