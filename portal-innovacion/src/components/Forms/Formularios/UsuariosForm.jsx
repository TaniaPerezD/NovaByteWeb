import React, { useState } from 'react';
import Swal from 'sweetalert2';

const UsuariosForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    rol: '',
    isDeleted: false,
    isCentro: false,
    isSociedad: false,
    isDocente: false,
    isGraduado: false,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateRoleLogic = () => {
    const { rol, isDocente, isCentro, isSociedad } = formData;

    if (rol === 'estudiante' && isDocente) {
      return 'Un estudiante no puede estar marcado como docente.';
    }

    if (rol === 'docente' && (isCentro || isSociedad)) {
      return 'Un docente no puede ser parte del centro o de la sociedad científica.';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, email, password, rol} = formData;

    if (!name || !email || !password || !rol) {
      Swal.fire('Error', 'Todos los campos son obligatorios.', 'error');
      return;
    }

    if (!validateEmail(email)) {
      Swal.fire('Error', 'El email no es válido.', 'error');
      return;
    }

    const roleError = validateRoleLogic();
    if (roleError) {
      Swal.fire('Error', roleError, 'error');
      return;
    }

    Swal.fire('Éxito', 'Usuario registrado correctamente.', 'success');
    onSuccess();
    // enviar los datos al servidor. devolver todo a los datos normales
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        name
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
      </label>

      <label>
        Email
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
        />
      </label>

      <label>
        Contraseña
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          required
        />
      </label>

      <label className="select-container">
        Rol
        <select
          name="rol"
          value={formData.rol}
          onChange={handleInputChange}
          required
          className="select"
        >
          <option value="">Seleccionar</option>
          <option value="estudiante">Estudiante</option>
          <option value="docente">Docente</option>
          <option value="admin">Admin</option>
        </select>
      </label>

      <div className="checkbox-group">
            {[
                { name: "isCentro", label: "Es Parte del Centro" },
                { name: "isSociedad", label: "Es Parte de la Sociedad Científica" },
                { name: "isDocente", label: "Es Docente" },
                { name: "isGraduado", label: "Está Graduado" },
            ].map(({ name, label }) => (
                <label key={name} className="checkbox-row">
                    <input
                        type="checkbox"
                        name={name}
                        checked={formData[name]}
                        onChange={handleInputChange}
                        className="checkbox-input"
                    />
                    <span className="checkbox-label">{label}</span>
                </label>
            ))}
      </div>

      <button type="submit">Registrar Usuario</button>
    </form>
  );
}; export default UsuariosForm;