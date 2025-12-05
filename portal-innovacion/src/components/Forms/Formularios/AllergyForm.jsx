import React, { useState } from 'react';
import Swal from 'sweetalert2';

const AllergyForm = ({ allergyData, onSave, onClose }) => {
  const [formData, setFormData] = useState(allergyData || {
    sustancia: '',
    severidad: 'baja',
    observacion: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    if (!formData.sustancia || !formData.observacion) {
      Swal.fire('Error', 'Todos los campos son obligatorios.', 'error');
      return;
    }

    Swal.fire('Éxito', 'Alergia guardada correctamente.', 'success');
    onSave(formData);
    onClose();
  };

  return (
    <div className="form">
      <label>
        Sustancia *
        <input
          type="text"
          name="sustancia"
          value={formData.sustancia}
          onChange={handleChange}
          placeholder="Ej: Penicilina, Polen, Mariscos"
          required
        />
      </label>

      <label>
        Severidad *
        <select
          name="severidad"
          value={formData.severidad}
          onChange={handleChange}
          required
          className="select-input"
        >
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
        </select>
      </label>

      <label>
        Observación *
        <textarea
          name="observacion"
          value={formData.observacion}
          onChange={handleChange}
          placeholder="Describe los síntomas y cualquier información relevante"
          rows="4"
          required
        ></textarea>
      </label>

      <div className="form-actions">
        <button type="button" onClick={handleSubmit} className="btn-submit">
          {allergyData ? 'Actualizar' : 'Guardar'} Alergia
        </button>
        <button type="button" onClick={onClose} className="btn-cancel">
          Cancelar
        </button>
      </div>
    </div>
  );
}; export default AllergyForm;