import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb';
import RightArrow from '../../components/SVG';
import { signUpMedico } from '../../services/authService';
import Swal from 'sweetalert2';

import { MdCalendarToday } from "react-icons/md";

import signUpImg from '../../assets/img/contact/signin.jpg';

const SignUpMainDoc = () => {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: '',
    apellidos: '',
    especialidad: '',
    email: '',
    fecha_nacimiento: '' // formato visual: dd/mm/yyyy
  });

  const [loading, setLoading] = useState(false);

  // -------------------------
  // Conversión dd/mm/yyyy → yyyy-mm-dd
  // -------------------------
  const convertirFecha = (str) => {
    if (!str.includes("/")) return null;
    const [d, m, a] = str.split("/");
    if (!d || !m || !a) return null;
    return `${a}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // -------------------------
  // Validaciones antes de enviar
  // -------------------------
  const validarFormulario = () => {

    if (form.nombre.trim().length < 2)
      return "Ingresa un nombre válido.";

    if (form.apellidos.trim().length < 2)
      return "Ingresa apellidos válidos.";

    if (form.especialidad.trim().length < 3)
      return "Ingresa una especialidad válida.";

    const emailValido = /\S+@\S+\.\S+/.test(form.email);
    if (!emailValido)
      return "Ingresa un correo válido.";

    // Validar fecha latina
    const fechaISO = convertirFecha(form.fecha_nacimiento);
    if (!fechaISO)
      return "La fecha debe estar en formato día/mes/año (ej: 23/04/2002).";

    const hoy = new Date();
    const fechaNac = new Date(fechaISO);
    if (fechaNac > hoy)
      return "La fecha de nacimiento no puede ser futura.";

    return null; // todo OK
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const error = validarFormulario();
    if (error) {
      Swal.fire({
        icon: "warning",
        title: "Validación",
        text: error
      });
      return;
    }

    try {
      setLoading(true);

      const fechaISO = convertirFecha(form.fecha_nacimiento);

      await signUpMedico({
        nombre: form.nombre.trim(),
        apellidos: form.apellidos.trim(),
        especialidad: form.especialidad.trim(),
        email: form.email.trim(),
        fecha_nacimiento: fechaISO
      });

      Swal.fire({
        icon: 'success',
        title: 'Registro exitoso',
        text: 'Te enviamos un enlace para crear tu contraseña.',
        confirmButtonColor: '#E79796'
      });

      // Redirigir después de 2.5 segundos
      setTimeout(() => navigate("/signin"), 2500);

    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error al registrar',
        text: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <Breadcrumb title="Registrarse" />

      <div className="it-signup-area pt-120 pb-120">
        <div className="container">
          
          <div className="it-signup-bg p-relative">

            <div className="it-signup-thumb d-none d-lg-block">
              <img src={signUpImg} alt="" />
            </div>

            <div className="row">
              <div className="col-xl-6 col-lg-6">

                <form onSubmit={handleSubmit}>
                  <div className="it-signup-wrap">

                    <h4 className="it-signup-title">Registro</h4>

                    <div className="it-signup-input-wrap mb-40">

                      <div className="it-signup-input mb-20">
                        <input
                          type="text"
                          name="nombre"
                          placeholder="Nombre *"
                          value={form.nombre}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="it-signup-input mb-20">
                        <input
                          type="text"
                          name="apellidos"
                          placeholder="Apellidos *"
                          value={form.apellidos}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="it-signup-input mb-20">
                        <input
                          type="text"
                          name="especialidad"
                          placeholder="Especialidad médica *"
                          value={form.especialidad}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="it-signup-input mb-20" style={{ position: "relative" }}>
                        <input
                          type="date"
                          id="fechaReal"
                          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (!value) return;
                            const [year, month, day] = value.split("-");
                            const fechaLatina = `${day}/${month}/${year}`;
                            setForm(prev => ({
                              ...prev,
                              fecha_nacimiento: fechaLatina
                            }));
                          }}
                        />

                        <input
                          type="text"
                          name="fecha_nacimiento"
                          placeholder="Fecha de nacimiento (dd/mm/yyyy) *"
                          value={form.fecha_nacimiento}
                          readOnly
                          onClick={() => document.getElementById("fechaReal").showPicker()}
                          required
                          style={{ paddingRight: "40px" }}
                        />

                        <MdCalendarToday
                          onClick={() => document.getElementById("fechaReal").showPicker()}
                          style={{
                            position: "absolute",
                            right: "10px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            cursor: "pointer",
                            fontSize: "22px",
                            color: "#555"
                          }}
                        />
                      </div>

                      <div className="it-signup-input mb-20">
                        <input
                          type="email"
                          name="email"
                          placeholder="Correo Electrónico *"
                          value={form.email}
                          onChange={handleChange}
                          required
                        />
                      </div>

                    </div>

                    <div className="it-signup-btn d-sm-flex justify-content-between align-items-center mb-40">
                      <button
                        type="submit"
                        className="ed-btn-theme"
                        disabled={loading}
                        style={{
                          opacity: loading ? 0.6 : 1,
                          pointerEvents: loading ? "none" : "auto"
                        }}
                      >
                        {loading ? "Enviando..." : "Registrarse"}
                        <i><RightArrow /></i>
                      </button>
                    </div>

                    <div className="it-signup-text">
                      <span>
                        ¿Ya tienes una cuenta?{" "}
                        <Link to="/signin">Iniciar Sesión</Link>
                      </span>
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

export default SignUpMainDoc;