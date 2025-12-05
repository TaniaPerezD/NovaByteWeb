import React, { useState } from 'react';
import Swal from 'sweetalert2';

const PrescriptionItemForm = ({ data, onSave, onClose }) => {
  const [formData, setFormData] = useState(data || {
    medicamento: '',
    via: '',
    dosis: '',
    frecuencia: '',
    duracion: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    if (!formData.medicamento || !formData.via || !formData.dosis || !formData.frecuencia || !formData.duracion) {
      Swal.fire('Error', 'Todos los campos son obligatorios.', 'error');
      return;
    }
    Swal.fire('Éxito', 'Medicamento guardado correctamente.', 'success');
    onSave(formData);
    onClose();
  };

  return (
    <div className="form">
        <label>
            Medicamento * 
            <input 
                type="text" 
                name="medicamento" 
                value={formData.medicamento} 
                onChange={handleChange} 
                placeholder="Nombre del medicamento" 
                required 
            />
        </label>

        <label>
            Vía * 
            <select 
                name="via" 
                value={formData.via} 
                onChange={handleChange} 
                required 
                className="select-input"
            >
                <option value="">Seleccionar</option>
                <option value="Oral">Oral</option>
                <option value="Intravenosa">Intravenosa</option>
                <option value="Intramuscular">Intramuscular</option>
                <option value="Subcutánea">Subcutánea</option>
                <option value="Tópica">Tópica</option>
            </select>
        </label>
        
        <label>
            Dosis * 
            <input 
                type="text" 
                name="dosis" 
                value={formData.dosis} 
                onChange={handleChange} 
                placeholder="Ej: 500mg, 1 tableta" 
                required 
            />
        </label>
        
        <label>
            Frecuencia * 
            <input 
                type="text" 
                name="frecuencia" 
                value={formData.frecuencia} 
                onChange={handleChange} 
                placeholder="Ej: Cada 8 horas" 
                required 
            />
        </label>
        
        <label>
            Duración * 
            <input 
                type="text" 
                name="duracion" 
                value={formData.duracion} 
                onChange={handleChange} 
                placeholder="Ej: 7 días, 2 semanas" 
                required 
            />
        </label>

        <div className="form-actions">
            <button type="button" onClick={handleSubmit} className="btn-submit">
                {data ? 'Actualizar' : 'Agregar'} Medicamento
            </button>
            <button type="button" onClick={onClose} className="btn-cancel">
                Cancelar
            </button>
        </div>
    </div>
  );
}; export default PrescriptionItemForm;