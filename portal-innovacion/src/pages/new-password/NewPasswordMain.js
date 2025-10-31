import React, { useState } from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

import signInImg from '../../assets/img/contact/signin.jpg';
import Swal from 'sweetalert2';
import { useNavigate, useLocation } from 'react-router';

const NewPasswordMain = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const token = params.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!token) {
      Swal.fire({
        icon: 'error',
        title: 'Ooops...',
        text: 'Enlace inválido o expirado',
      });
      return;
    }
    if (password.trim().length < 8) {
      Swal.fire({
        icon: 'error',
        title: 'Ooops...',
        text: 'La contraseña debe tener mínimo 8 caracteres',
      });
      return;
    }
    if (password !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Ooops...',
        text: 'Las contraseñas no coinciden',
      });
      return;
    }
    Swal.fire({
      icon: 'success',
      title: 'Contraseña actualizada',
      text: 'Tu contraseña ha sido actualizada correctamente.',
    }).then(() => {
      navigate('/signin');
    });
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
                    <h4 className="it-signup-title" style={{ fontSize: '34px', textAlign: 'left', marginBottom: '14px' }}>
                      NUEVA CONTRASEÑA
                    </h4>
                    <div style={{ height: '1px', background: '#CBD2DC', width: '100%', marginBottom: '20px' }}></div>
                    <p className="it-signup-subtitle" style={{ textAlign: 'left', marginBottom: '20px' }}>
                      Ingresa tu nueva contraseña segura
                    </p>
                    <div className="it-signup-input-wrap">
                      <div className="it-signup-input mb-20" style={{ position: 'relative' }}>
                        <input
                          type={showPass ? 'text' : 'password'}
                          placeholder="Nueva contraseña"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="off"
                          style={{ paddingRight: '46px', borderRadius: '10px' }}
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
                      <div className="it-signup-input mb-10" style={{ position: 'relative' }}>
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="Confirmar contraseña"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          autoComplete="off"
                          style={{ paddingRight: '46px', borderRadius: '10px' }}
                        />
                        <span
                          onClick={() => setShowConfirm(!showConfirm)}
                          style={{
                            position: 'absolute',
                            right: '18px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            cursor: 'pointer',
                            color: '#1F2937',
                          }}
                        >
                          {showConfirm ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '20px' }}>Mínimo 8 caracteres</p>
                    </div>
                    <div className="d-flex flex-column align-items-center gap-3 mb-40" style={{ width: '100%' }}>
                      <button type="submit" className="w-100" style={{ background: '#E79796', border: 'none', color: '#fff', fontWeight: 500, borderRadius: '8px', padding: '10px 0', fontSize: '16px' }}>
                        Enviar enlace de recuperación
                      </button>
                      <button type="button" onClick={() => navigate('/signin')} className="w-100" style={{ background: '#E9EDF4', color: '#E79796', border: 'none', borderRadius: '8px', padding: '10px 0', fontWeight: 500, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '18px', lineHeight: '1' }}>←</span> Volver al inicio de sesión
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

export default NewPasswordMain;
