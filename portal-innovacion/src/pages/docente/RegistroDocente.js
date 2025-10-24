import React from 'react'; //useEffect, useDispatch
import Breadcrumb from '../../components/Breadcrumb';
import RightArrow from '../../components/SVG';

import signInImg from '../../assets/img/contact/signin.jpg';
import { useForm } from '../../hooks/useForm';
import validator from 'validator';
import Swal from 'sweetalert2';
// import { useDispatch } from 'react-redux';
// import { loginUser } from '../../redux/user/thunk';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { mainApi } from '../../axios';

const RegistroDocente = () => {
  const navigate = useNavigate();
  const usersState = useSelector((state) => state.users);
  const [formValues, handleInputChange] = useForm({name: "", email: "", password: ""}) // reset como parametro
  const { name, email, password } = formValues

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log(usersState.token)
    if (isFormValid()) {
      await mainApi.post('/api/docente', {
        name,
        email,
        password,
        rol: "Docente",
        imagen: "url_de_imagen_del_docente.jpg",
        socialLinks: [
          "https://facebook.com/juanperez",
          "https://twitter.com/juanperez"
        ],
        designation: "Docente",
        state: true
      },{
        headers: {
          'Content-type': 'application/json',
          'x-token': usersState.token  // Usar el token en las cabeceras
        }
      })
      .then(resp => {
        Swal.fire({
          icon: "success",
          title: "Bien",
          text: "Docente Registrado"
        })
        navigate("/teacher")
      })
      .catch(err => {
        console.log(err)
        Swal.fire({
          icon: "error",
          title: "Ooops...",
          text: "Error al registrar docente"
        })
      })
    }
  }

  // const handleLogin = (e) => {
  //   console.log("Envía")
  //   e.preventDefault()
  //   if (isFormValid()) {
  //     reset()
  //   }
  // }

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
    } else if (name.length < 2) {
      Swal.fire({
        icon: "error",
        title: "Ooops...",
        text: "El nombre es muy corto"
      })
      return false
    }
    return true
  }

  return (
    <main>
      <Breadcrumb title="Registro Docente" />

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
                    <h4 className="it-signup-title">Registro Docentes</h4>
                    <div className="it-signup-input-wrap">
                      <div className="it-signup-input mb-20">
                        <input 
                          type="text" 
                          placeholder="Nombre" 
                          name="name"
                          autoComplete="off"
                          value={name}
                          onChange={handleInputChange}
                        />
                      </div>
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
                        Registrar
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

export default RegistroDocente;
