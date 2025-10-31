// src/pages/new-password/NewPasswordMain.js
import React, { useState } from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import signInImg from '../../assets/img/contact/verificaciondospasos.jpg';
import Swal from 'sweetalert2';
import { useNavigate, useLocation } from 'react-router';

const NewPasswordMain = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const token = params.get('token');
  const email = params.get('email'); // 👈 lo leemos del query

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      Swal.fire({
        icon: 'error',
        title: 'Enlace inválido',
        text: 'El enlace de recuperación no es válido o ya expiró.',
        confirmButtonColor: '#E79796',
      });
      return;
    }

    if (password.trim().length < 8) {
      Swal.fire({
        icon: 'error',
        title: 'Contraseña muy corta',
        text: 'La contraseña debe tener mínimo 8 caracteres.',
        confirmButtonColor: '#E79796',
      });
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Las contraseñas no coinciden',
        text: 'Vuelve a escribir la contraseña.',
        confirmButtonColor: '#E79796',
      });
      return;
    }

    try {
      setLoading(true);

      const resp = await fetch(
  'https://nvfhmlfbocdiczpxgidu.supabase.co/functions/v1/reset-password',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52ZmhtbGZib2NkaWN6cHhnaWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNzEyNzUsImV4cCI6MjA3MzY0NzI3NX0.3tnqThhBZblaC3bbH6nfJRD-TKg2WVhkF3RpV2BIHyA', // ← pega tu anon key aquí
      Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52ZmhtbGZib2NkaWN6cHhnaWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNzEyNzUsImV4cCI6MjA3MzY0NzI3NX0.3tnqThhBZblaC3bbH6nfJRD-TKg2WVhkF3RpV2BIHyA`, // ← igual aquí
    },
    body: JSON.stringify({
      token,
      email,
      password,
    }),
  }
);

      const data = await resp.json();

      if (!resp.ok || !data.ok) {
        Swal.fire({
          icon: 'error',
          title: 'No se pudo actualizar',
          text: data.message || 'Intenta de nuevo o solicita otro enlace.',
          confirmButtonColor: '#E79796',
        });
        return;
      }

      // éxito
      Swal.fire({
        icon: 'success',
        title: 'Contraseña actualizada',
        text: 'Ya puedes iniciar sesión con tu nueva contraseña.',
        confirmButtonColor: '#E79796',
      }).then(() => {
        navigate('/signin');
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'No se pudo actualizar',
        text: 'No pudimos contactar al servidor. Intenta otra vez.',
        confirmButtonColor: '#E79796',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <Breadcrumb title="Nueva Contraseña" />

      <div className="it-signup-area pt-120 pb-120">
        <div className="container">
          <div className="it-signup-bg p-relative">
            <div className="it-signup-thumb d-none d-lg-block">
              <img src={signInImg} alt="" />
            </div>
            <div className="row">
              <div className="col-xl-6 col-lg-6">
                <form onSubmit={handleSubmit}>
                  <div className="it-signup-wrap">
                    <h4
                      className="it-signup-title"
                      style={{
                        fontSize: '34px',
                        textAlign: 'left',
                        marginBottom: '14px',
                      }}
                    >
                      NUEVA CONTRASEÑA
                    </h4>
                    <div
                      style={{
                        height: '1px',
                        background: '#CBD2DC',
                        width: '100%',
                        marginBottom: '20px',
                      }}
                    ></div>

                    {/* email de referencia */}
                    <p
                      style={{
                        textAlign: 'left',
                        marginBottom: '6px',
                        color: '#6B7280',
                        fontSize: '13px',
                      }}
                    >
                      Email:
                    </p>
                    <p
                      style={{
                        textAlign: 'left',
                        marginBottom: '16px',
                        fontWeight: 600,
                        color: '#111827',
                        wordBreak: 'break-all',
                      }}
                    >
                      {email ? email : '—'}
                    </p>

                    <p
                      className="it-signup-subtitle"
                      style={{ textAlign: 'left', marginBottom: '20px' }}
                    >
                      Ingresa tu nueva contraseña segura
                    </p>

                    <div className="it-signup-input-wrap">
                      <div
                        className="it-signup-input mb-10"
                        style={{ position: 'relative' }}
                      >
                        <input
                          type={showPass ? 'text' : 'password'}
                          placeholder="Nueva contraseña"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="off"
                          style={{
                            paddingRight: '46px',
                            borderRadius: '10px',
                          }}
                        />
                        <span
                          onClick={() => setShowPass(!showPass)}
                          style={{
                            position: 'absolute',
                            right: '18px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            cursor: 'pointer',
                            color: '#1F2937',
                          }}
                        >
                          {showPass ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: '13px',
                          color: '#9CA3AF',
                          marginBottom: '20px',
                        }}
                      >
                        Mínimo 8 caracteres
                      </p>
                      <div
                        className="it-signup-input mb-10"
                        style={{ position: 'relative' }}
                      >
                        <input
                          type={showPass ? 'text' : 'password'}
                          placeholder="Confirmar contraseña"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          autoComplete="off"
                          style={{
                            paddingRight: '46px',
                            borderRadius: '10px',
                          }}
                        />
                        <span
                          onClick={() => setShowPass(!showPass)}
                          style={{
                            position: 'absolute',
                            right: '18px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            cursor: 'pointer',
                            color: '#1F2937',
                          }}
                        >
                          {showPass ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                        </span>
                      </div>
                    </div>

                    <div
                      className="d-flex flex-column align-items-center gap-3 mb-40"
                      style={{ width: '100%' }}
                    >
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-100"
                        style={{
                          background: '#E79796',
                          border: 'none',
                          color: '#fff',
                          fontWeight: 500,
                          borderRadius: '8px',
                          padding: '10px 0',
                          fontSize: '16px',
                          opacity: loading ? 0.7 : 1,
                          cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate('/signin')}
                        className="w-100"
                        style={{
                          background: '#E9EDF4',
                          color: '#E79796',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '10px 0',
                          fontWeight: 500,
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <span style={{ fontSize: '18px', lineHeight: '1' }}>←</span>{' '}
                        Volver al inicio de sesión
                      </button>
                    </div>
                  </div>
                </form>
              </div>
              {/* si quieres, aquí a la derecha puedes mostrar una imagen o dejarlo vacío */}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default NewPasswordMain;