import React, { useState, useRef } from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router';
import signInImg from '../../assets/img/contact/signin.jpg';
import phoneIcon from '../../assets/img/class/phone.png';

const TwoVerificationCodeMain = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputsRef = useRef([]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (/^\d?$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      if (value && index < 5) {
        inputsRef.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && code[index] === '' && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.some(digit => digit === '')) {
      Swal.fire({
        icon: 'error',
        title: 'Código incompleto',
        text: 'Por favor ingresa los 6 dígitos.',
      });
      return;
    }
    // Simulate verification delay
    setTimeout(() => {
      Swal.fire({
        icon: 'success',
        title: 'Código verificado',
        text: 'Tu identidad ha sido confirmada exitosamente.',
      }).then(() => {
        navigate('/newpassword');
      });
    }, 500);
  };

  const handleResend = (e) => {
    e.preventDefault();
    Swal.fire({
      icon: 'info',
      title: 'Código reenviado',
      text: 'Te hemos enviado un nuevo código de verificación.',
    });
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
              <div className="col-xl-6 col-lg-6">
                <form onSubmit={handleSubmit}>
                  <div className="it-signup-wrap" style={{ padding: '40px' }}>
                    <h4 className="it-signup-title d-flex align-items-center gap-3" style={{ fontWeight: '700', marginBottom: '20px' }}>
                      <img src={phoneIcon} alt="phone icon" style={{ width: '32px', height: '32px' }} />
                      INGRESAR CÓDIGO
                    </h4>
                    <p className="it-signup-subtitle" style={{ marginBottom: '30px' }}>
                      Ingresa el código de 6 dígitos enviado a tu correo electrónico
                    </p>
                    <div className="d-flex justify-content-center gap-3 mb-3">
                      {code.map((digit, index) => (
                        <input
                          key={index}
                          type="text"
                          maxLength="1"
                          value={digit}
                          onChange={(e) => handleChange(e, index)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          ref={el => inputsRef.current[index] = el}
                          style={{
                            width: '48px',
                            height: '56px',
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            textAlign: 'center',
                            fontSize: '22px',
                            fontWeight: '600',
                            backgroundColor: 'white',
                            outline: 'none',
                          }}
                        />
                      ))}
                    </div>
                    <div className="text-center mb-4">
                      <a href="/" onClick={handleResend} style={{ color: '#E9B0A3', fontWeight: '600', textDecoration: 'underline', cursor: 'pointer' }}>
                        Reenviar código
                      </a>
                    </div>
                    <div className="d-flex justify-content-center align-items-center gap-4 mt-4">
                      <button
                        type="button"
                        onClick={handleBack}
                        style={{
                          background: '#FBECEC',
                          border: '1px solid #E9B0A3',
                          color: '#E9B0A3',
                          fontWeight: '600',
                          borderRadius: '8px',
                          height: '52px',
                          width: '150px',
                          cursor: 'pointer',
                        }}
                      >
                        Volver
                      </button>
                      <button
                        type="submit"
                        style={{
                          background: '#E9B0A3',
                          border: 'none',
                          color: 'white',
                          fontWeight: '600',
                          borderRadius: '8px',
                          height: '52px',
                          width: '150px',
                          cursor: 'pointer',
                        }}
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                </form>
              </div>
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
