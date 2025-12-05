import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const PrescriptionForm = ({ data, onSave, onClose }) => {  // ✅ Cambiar a 'data'
  const [formData, setFormData] = useState({
    indicaciones_generales: '',
    fecha: ''
  });

  // ✅ useEffect para cargar datos cuando cambia 'data'
  useEffect(() => {
    console.log("💊 PrescriptionForm - data recibido:", data); // ✅ LOG
    if (data) {
      setFormData({
        indicaciones_generales: data.indicaciones_generales || '',
        fecha: data.fecha || ''
      });
    } else {
      // Resetear formulario si no hay data
      setFormData({
        indicaciones_generales: '',
        fecha: new Date().toISOString().split('T')[0] // Fecha actual por defecto
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