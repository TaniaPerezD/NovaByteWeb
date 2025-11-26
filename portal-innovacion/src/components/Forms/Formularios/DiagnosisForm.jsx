import React, { useState } from 'react';
import Swal from 'sweetalert2';

const DiagnosisForm = ({ data, onSave, onClose }) => {
  const [formData, setFormData] = useState(data || {
    codigo: '',
    descripcion: '',
    principal: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = () => {
    if (!formData.codigo || !formData.descripcion) {
      Swal.fire('Error', 'El código y la descripción son obligatorios.', 'error');
      return;
    }
    Swal.fire('Éxito', 'Diagnóstico guardado correctamente.', 'success');
    onSave(formData);
    onClose();
  };

  return (
    <div className="form">
        <label>
            Código * 
            <input 
                type="text" 
                name="codigo" 
                value={formData.codigo} 
                onChange={handleChange} 
                placeholder="Ej: I10, J00" 
                required 
            />
        </label>
        
        <label>
            Descripción * 
            <textarea 
                name="descripcion" 
                value={formData.descripcion} 
                onChange={handleChange} 
                rows="3" 
                placeholder="Descripción del diagnóstico" 
                required 
            />
        </label>

        <label className="checkbox-label">
            <input 
                type="checkbox" 
                name="principal" 
                checked={formData.principal} 
                onChange={handleChange}
                className="checkbox-input-hidden" 
            />
            <span className="checkbox-custom"></span>
            <span className="checkbox-text">Diagnóstico Principal</span>
        </label>

        <div className="form-actions">
            <button type="button" onClick={handleSubmit} className="btn-submit">
                {data ? 'Actualizar' : 'Agregar'} Diagnóstico
            </button>
            <button type="button" onClick={onClose} className="btn-cancel">
                Cancelar
            </button>
        </div>
    </div>
  );
}; export default DiagnosisForm;