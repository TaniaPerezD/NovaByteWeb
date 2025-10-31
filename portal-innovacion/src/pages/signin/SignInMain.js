import React from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import RightArrow from '../../components/SVG';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

import signInImg from '../../assets/img/contact/signin.jpg';
import { useForm } from '../../hooks/useForm';
import validator from 'validator';
import Swal from 'sweetalert2';
import { loginStep1 } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const SignInMain = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const [formValues, handleInputChange, reset] = useForm({email: "", password: ""})
  const { email, password } = formValues

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;
    setLoading(true);
    try {
      await loginStep1(email, password);
      await Swal.fire({
        icon: "success",
        title: "Código enviado",
        text: "Te enviamos un código de verificación a tu correo.",
        confirmButtonColor: "#E79796"
      });
      navigate(`/two-verification?email=${encodeURIComponent(email)}`);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "No se pudo iniciar sesión",
        text: err.message || "Revisa tu correo y contraseña",
        confirmButtonColor: "#E79796"
      });
    } finally {
      setLoading(false);
    }
  }

  const isFormValid = () => {
    if (!validator.isEmail(email)) {
      Swal.fire({
        icon: "error",
        title: "Ooops...",
        text: "Correo electrónico inválido"
      })
      return false
    } else if (password.length < 4) {
      Swal.fire({
        icon: "error",
        title: "Ooops...",
        text: "La contraseña necesita tener mínimo 5 carácteres"
      })
      return false
    }
    return true
  }

  return (
    <main>
      <Breadcrumb title="Inicio de Sesión" />

      <div className="it-signup-area pt-120 pb-120">
        <div className="container">
          <div className="it-signup-bg p-relative">
            <div className="it-signup-thumb d-none d-lg-block">
              <img src={signInImg} alt="" />
            </div>
            <div className="row">
              <div className="col-xl-6 col-lg-6">
                <form onSubmit={handleLogin}>
                  <div className="it-signup-wrap">
                    <h4 className="it-signup-title">Iniciar Sesión</h4>
                    <div className="it-signup-input-wrap">
                      <div className="it-signup-input mb-20">
                        <input 
                          type="email" 
                          placeholder="Correo Electrónico" 
                          name="email"
                          autoComplete="off"
                          value={email}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="it-signup-input mb-20" style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Contraseña"
                          name="password"
                          value={password}
                          onChange={handleInputChange}
                          style={{ paddingRight: '40px' }}
                        />
                        <span
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute',
                            right: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            cursor: 'pointer',
                            color: '#7F8D9D',
                          }}
                        >
                          {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </span>
                      </div>
                    </div>
                    <div className="it-signup-btn d-sm-flex justify-content-between align-items-center mb-40">
                      <button type="submit" className="ed-btn-theme" disabled={loading}>
                        {loading ? "Enviando..." : "Ingresar"}
                        {!loading && (
                          <i>
                            <RightArrow />
                          </i>
                        )}
                      </button>
                      <Link to="/reset-password" className="it-signup-forgot" style={{ color: '#E79796' }}>
                        ¿Olvidaste tu contraseña?
                      </Link>
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

export default SignInMain;
