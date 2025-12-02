import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const PatientForm = ({ onSuccess, initialFormData, onClose }) => {
  const [formData, setFormData] = useState(initialFormData || {
    nombre: '',
    apellidos: '',
    email: '',
    fechaNacimiento: '',
  });

  useEffect(() => {
    if (initialFormData) {
      setFormData({
        nombre: initialFormData.nombre || '',
        apellidos: initialFormData.apellidos || '',
        email: initialFormData.email || '',
        fechaNacimiento: initialFormData.fecha_nacimiento || '',
      });
    }
  }, [initialFormData]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = (e) => {
    e.preventDefault();

    const { nombre, apellidos, email, fechaNacimiento } = formData;

    if (!nombre || !apellidos || !email || !fechaNacimiento) {
      Swal.fire('Error', 'Todos los campos obligatorios deben ser completados.', 'error');
      return;
    }

    if (!validateEmail(email)) {
      Swal.fire('Error', 'El email no es válido.', 'error');
      return;
    }

    Swal.fire('Éxito', 'Paciente registrado correctamente.', 'success');
    onSuccess(formData);
    onClose();
  };
  

  return (
    <div className="form">
      <label>
        Nombre *
        <input
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={handleInputChange}
          required
        />
      </label>

      <label>
        Apellidos *
        <input
          type="text"
          name="apellidos"
          value={formData.apellidos}
          onChange={handleInputChange}
          required
        />
      </label>

      <label>
        Email *
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
        />
      </label>

      <label>
        Fecha de Nacimiento *
        <input
          type="date"
          name="fechaNacimiento"
          value={formData.fechaNacimiento}
          onChange={handleInputChange}
          required
        />
      </label>

      <div className="form-actions">
        <button type="button" onClick={handleSubmit} className="btn-submit">
          {initialFormData ? 'Actualizar' : 'Registrar'} Paciente
        </button>
        <button type="button" onClick={onClose} className="btn-cancel">
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default PatientForm;