import React, { useState } from 'react';
import Swal from 'sweetalert2';

const BackgroundForm = ({ backgroundData, onSave, onClose }) => {
  const [formData, setFormData] = useState(backgroundData || {
    tipo: 'Patológico',
    descripcion: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    if (!formData.tipo || !formData.descripcion) {
      Swal.fire('Error', 'Todos los campos son obligatorios.', 'error');
      return;
    }

    Swal.fire('Éxito', 'Antecedente guardado correctamente.', 'success');
    onSave(formData);
    onClose();
  };

  return (
    <div className="form">
      <label>
        Tipo de Antecedente *
        <input
          name="tipo"
          value={formData.tipo}
          onChange={handleChange}
          required
        >
        </input>
      </label>

      <label>
        Descripción *
        <textarea
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          placeholder="Describe el antecedente con detalle"
          rows="5"
          required
        ></textarea>
      </label>

      <div className="form-actions">
        <button type="button" onClick={handleSubmit} className="btn-submit">
          {backgroundData ? 'Actualizar' : 'Guardar'} Antecedente
        </button>
        <button type="button" onClick={onClose} className="btn-cancel">
          Cancelar
        </button>
      </div>
    </div>
  );
}; export default BackgroundForm;