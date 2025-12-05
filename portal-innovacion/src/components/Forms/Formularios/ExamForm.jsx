import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const ExamForm = ({ examData, onSave, onClose }) => {
  const [formData, setFormData] = useState({ tipo: '', indicacion: '' });

  
  useEffect(() => {

    if (examData) {
      setFormData({
        tipo: examData.tipo || '',
        indicacion: examData.indicacion || ''
      });
    } else {
      console.log('esta vacio');
    }
  }, [examData]);

  console.log('Estado actual del formData:', formData);

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
                {examData ? 'Actualizar' : 'Guardar'} Examen
            </button>
            <button type="button" onClick={onClose} className="btn-cancel">
                Cancelar
            </button>
        </div>
    </div>
  );
}; 

export default ExamForm;