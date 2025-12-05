import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { MdCalendarToday } from "react-icons/md";
import { signUpMedico } from "../../services/authService";

const SignUpMainDoc = () => {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    apellidos: "",
    especialidad: "",
    email: "",
    fecha_nacimiento: ""
  });

  const [loading, setLoading] = useState(false);

  // Conversión dd/mm/yyyy → yyyy-mm-dd
  const convertirFecha = (str) => {
    if (!str.includes("/")) return null;
    const [d, m, a] = str.split("/");
    return `${a}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validar = () => {
    if (form.nombre.trim().length < 2) return "Ingresa un nombre válido.";
    if (form.apellidos.trim().length < 2) return "Ingresa apellidos válidos.";
    if (form.especialidad.trim().length < 3) return "Ingresa una especialidad válida.";

    const emailReg = /\S+@\S+\.\S+/;
    if (!emailReg.test(form.email)) return "Ingresa un correo válido.";

    if (!form.fecha_nacimiento) return "Selecciona una fecha válida.";

    const fechaISO = convertirFecha(form.fecha_nacimiento);
    if (!fechaISO) return "Formato de fecha inválido.";

    if (new Date(fechaISO) > new Date()) return "La fecha no puede ser futura.";

    return null;
  };

  const enviar = async (e) => {
    e.preventDefault();
    const error = validar();

    if (error) {
      Swal.fire({
        icon: "warning",
        title: "Validación",
        text: error,
        confirmButtonColor: "#b56b75"
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
        icon: "success",
        title: "Registro exitoso",
        text: "Se envió un enlace al correo del médico.",
        confirmButtonColor: "#b56b75"
      });

      setTimeout(() => navigate("/medico-admin"), 2000);

    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo completar el registro.",
        confirmButtonColor: "#b56b75"
      });
    } finally {
      setLoading(false);
    }
  };

  const hoy = new Date().toISOString().split("T")[0];

  return (
    <main style={{ minHeight: "100vh", padding: "30px" }}>
      <div className="container" style={{ maxWidth: "950px" }}>

        {/* Título */}
        <h1 style={{ color: "#A7727D", fontWeight: "700", marginBottom: "10px" }}>
          Registrar Médico
        </h1>

        <p style={{ color: "#6A5F5F", marginBottom: "30px", fontSize: "16px" }}>
          Complete los datos del médico para registrarlo en el sistema.
        </p>

        {/* Card */}
        <div
          style={{
            background: "#FFFFFF",
            padding: "40px 35px",
            borderRadius: "20px",
            boxShadow: "0 8px 28px rgba(0,0,0,0.06)"
          }}
        >

          <form onSubmit={enviar}>

            {/* FILA 1 */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Juan"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Apellidos</label>
                <input
                  type="text"
                  name="apellidos"
                  value={form.apellidos}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Pérez Ramírez"
                />
              </div>
            </div>

            {/* FILA 2 */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Especialidad</label>
                <input
                  type="text"
                  name="especialidad"
                  value={form.especialidad}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Cardiología"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Correo</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>

            {/* Fecha */}
            <div className="form-group" style={{ width: "50%", position: "relative" }}>
              <label className="form-label">Fecha de nacimiento</label>

              <input
                type="date"
                id="fechaReal"
                min="1900-01-01"
                max={hoy}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  cursor: "pointer"
                }}
                onChange={(e) => {
                  const [y, m, d] = e.target.value.split("-");
                  setForm({
                    ...form,
                    fecha_nacimiento: `${d}/${m}/${y}`
                  });
                }}
              />

              <input
                type="text"
                readOnly
                value={form.fecha_nacimiento}
                className="form-input"
                placeholder="dd/mm/yyyy"
                onClick={() => document.getElementById("fechaReal").showPicker()}
                style={{ paddingRight: "40px" }}
              />

              <MdCalendarToday
                size={24}
                style={{
                  position: "absolute",
                  right: "10px",
                  bottom: "12px",
                  cursor: "pointer",
                  color: "#A7727D"
                }}
                onClick={() => document.getElementById("fechaReal").showPicker()}
              />
            </div>

            {/* BOTÓN */}
            <button
              type="submit"
              disabled={loading}
              className="btn-submit"
            >
              {loading ? "Registrando..." : "Registrar Médico"}
            </button>

          </form>
        </div>
      </div>

      {/* ESTILOS */}
      <style>
        {`
          .form-row {
            display: flex;
            gap: 25px;
            margin-bottom: 25px;
          }

          .form-group {
            flex: 1;
            display: flex;
            flex-direction: column;
          }

          .form-label {
            font-weight: 600;
            color: #7D5A5A;
            margin-bottom: 8px;
            font-size: 15px;
          }

          .form-input {
            height: 48px;
            border-radius: 10px;
            padding: 12px 14px;
            border: 1.5px solid #E6D9D9;
            outline: none;
            font-size: 15px;
            color: #5C4A4A;
            background: #FFF;
            transition: 0.2s;
          }
          
          .form-input:focus {
            border-color: #D5A1A8;
            box-shadow: 0 0 0 3px rgba(213,161,168,0.25);
          }

          .btn-submit {
            margin-top: 25px;
            background: #B56B75;
            color: white;
            width: 100%;
            padding: 15px;
            border-radius: 12px;
            font-size: 17px;
            font-weight: 600;
            border: none;
            cursor: pointer;
            transition: 0.25s;
          }

          .btn-submit:hover {
            background: #A45F68;
          }

          .btn-submit:disabled {
            opacity: 0.75;
            cursor: not-allowed;
          }

          @media (max-width: 768px) {
            .form-row {
              flex-direction: column;
            }
            .form-group {
              width: 100%;
            }
          }
        `}
      </style>
    </main>
  );
};

export default SignUpMainDoc;