import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const PrescriptionForm = ({ data, onSave, onClose }) => {  
  const [formData, setFormData] = useState({
    indicaciones_generales: '',
    fecha: ''
  });

  useEffect(() => {
    console.log("data recibido:", data); 
    if (data) {
      setFormData({
        indicaciones_generales: data.indicaciones_generales || '',
        fecha: data.fecha || ''
      });
    } else {
      setFormData({
        indicaciones_generales: '',
        fecha: new Date().toISOString().split('T')[0]
      });
    }
  }, [data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    if (!formData.indicaciones_generales || !formData.fecha) {
      Swal.fire('Error', 'Todos los campos son obligatorios.', 'error');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="form">
        <label>
            Indicaciones Generales * 
            <textarea 
                name="indicaciones_generales" 
                value={formData.indicaciones_generales} 
                onChange={handleChange} 
                rows="4" 
                placeholder="Instrucciones generales para el paciente" 
                required 
            />
        </label>
        <label>
            Fecha * 
            <input 
                type="date" 
                name="fecha" 
                value={formData.fecha} 
                onChange={handleChange} 
                required 
            />
        </label>
        <div className="form-actions">
            <button type="button" onClick={handleSubmit} className="btn-submit">
                {data ? 'Actualizar' : 'Crear'} Receta
            </button>
            <button type="button" onClick={onClose} className="btn-cancel">
                Cancelar
            </button>
        </div>
    </div>
  );
};

export default PrescriptionForm;