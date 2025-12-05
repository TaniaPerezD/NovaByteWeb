import React, { useState } from 'react';
import Swal from 'sweetalert2';


const ClinicalArchiveForm = ({ fileData, onSave, onClose }) => {
  const [formData, setFormData] = useState(fileData || {
    tipo: '',
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

    Swal.fire('Éxito', 'Archivo clínico guardado correctamente.', 'success');
    onSave(formData);
    onClose();
  };

  return (
    <div className="form">
      <label>
        Tipo de Archivo Clínico *
        <input
          type="text"
          name="tipo"
          value={formData.tipo}
          onChange={handleChange}
          placeholder="Ej: Ginecología, Embarazo, Control Familiar"
          required
        />
      </label>

      <label>
        Descripción *
        <textarea
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          placeholder="Describe el propósito y contenido de este archivo clínico"
          rows="4"
          required
        ></textarea>
      </label>

      <div className="form-actions">
        <button type="button" onClick={handleSubmit} className="btn-submit">
          {fileData ? 'Actualizar' : 'Guardar'} Archivo
        </button>
        <button type="button" onClick={onClose} className="btn-cancel">
          Cancelar
        </button>
      </div>
    </div>
  );
}; export default ClinicalArchiveForm;