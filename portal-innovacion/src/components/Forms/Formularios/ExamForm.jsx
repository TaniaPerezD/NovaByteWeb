import React, { useState } from 'react';
import Swal from 'sweetalert2';

const ExamForm = ({ data, onSave, onClose }) => {
  const [formData, setFormData] = useState(data || { tipo: '', indicacion: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    if (!formData.tipo || !formData.indicacion) {
      Swal.fire('Error', 'Todos los campos son obligatorios.', 'error');
      return;
    }
    Swal.fire('Éxito', 'Examen guardado correctamente.', 'success');
    onSave(formData);
    onClose();
  };

  return (
    <div className="form">
        <label>
            Tipo de Examen * 
            <input 
            type="text" 
            name="tipo" 
            value={formData.tipo} 
            onChange={handleChange} 
            placeholder="Ej: Radiografía, Ecografía" 
            required />
        </label>

        <label>
            Indicación * 
            <textarea 
            name="indicacion" 
            value={formData.indicacion} 
            onChange={handleChange} 
            rows="3" 
            placeholder="Motivo del examen" 
            required />
        </label>
        
        <div className="form-actions">
            <button type="button" onClick={handleSubmit} className="btn-submit">
                {data ? 'Actualizar' : 'Guardar'} Examen
            </button>
            <button type="button" onClick={onClose} className="btn-cancel">
                Cancelar
            </button>
        </div>
    </div>
  );
}; export default ExamForm;