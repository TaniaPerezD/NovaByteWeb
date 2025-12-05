import React, { useState } from 'react';
import Swal from 'sweetalert2';

const ExamResultForm = ({ data, onSave, onClose }) => {
  const [formData, setFormData] = useState(data || { informe: '', hallazgo: '', fecha_resultado: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    if (!formData.informe || !formData.hallazgo || !formData.fecha_resultado) {
      Swal.fire('Error', 'Todos los campos son obligatorios.', 'error');
      return;
    }
    Swal.fire('Éxito', 'Resultado guardado correctamente.', 'success');
    onSave(formData);
    onClose();
  };

  return (
    <div className="form">
        <label>
            Informe * 
            <textarea 
                name="informe" 
                value={formData.informe} 
                onChange={handleChange} 
                rows="3" 
                placeholder="Descripción del informe" 
                required 
            />
        </label>

        <label>
            Hallazgo * 
            <textarea 
                name="hallazgo" 
                value={formData.hallazgo} 
                onChange={handleChange} 
                rows="3" 
                placeholder="Hallazgos principales" 
                required
            />
        </label>

        <label>
            Fecha de Resultado * 
            <input 
                type="date" 
                name="fecha_resultado" 
                value={formData.fecha_resultado} 
                onChange={handleChange} 
                required 
            />
        </label>
        
        <div className="form-actions">
            <button type="button" onClick={handleSubmit} className="btn-submit">
                {data ? 'Actualizar' : 'Agregar'} Resultado
            </button>

            <button type="button" onClick={onClose} className="btn-cancel">
                Cancelar
            </button>
        </div>
    </div>
  );
}; export default ExamResultForm;