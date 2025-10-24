import React, { useEffect } from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import RightArrow from '../../components/SVG';

import signInImg from '../../assets/img/contact/signin.jpg';
import { useForm } from '../../hooks/useForm';
import validator from 'validator';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { loginUser } from '../../redux/user/thunk';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';

const SignInMain = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate();
  const usersState = useSelector((state) => state.users);

  const [formValues, handleInputChange, reset] = useForm({email: "", password: ""})
  const { email, password } = formValues

  const handleLogin = (e) => {
    console.log("Envía")
    e.preventDefault()
    if (isFormValid()) {
      dispatch(loginUser(email, password))
      reset()
    }
  }

  useEffect(() => {
    if(usersState.uid) {
      Swal.fire({
        icon: "success",
        title: "Bienvenido",
        text: "Inicio de sesión correcto"
      })
      navigate("/")
    }
  }, [usersState.uid, navigate])

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
                      <div className="it-signup-input mb-20">
                        <input 
                          type="password" 
                          placeholder="Contraseña" 
                          name="password"
                          value={password}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="it-signup-btn d-sm-flex justify-content-between align-items-center mb-40">
                      <button type="submit" className="ed-btn-theme">
                        Ingresar
                        <i>
                          <RightArrow />
                        </i>
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

export default SignInMain;
