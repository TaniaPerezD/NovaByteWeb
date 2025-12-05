import React, { useState, useEffect} from 'react';
import Swal from 'sweetalert2';

const VitalSignsForm = ({ data, onSave, onClose }) => {

  const [formData, setFormData] = useState({
    presion_sistolica: '',
    presion_diastolica: '',
    frecuencia_cardiaca: '',
    temperatura: '',
    saturacion_oxigeno: '',
    peso_kg: '',
    talla_cm: ''
  });

  useEffect(() => {
    if (data && typeof data === 'object') {
        setFormData({
            presion_sistolica: data.presion_sistolica ?? '',
        frecuencia_cardiaca: data.frecuencia_cardiaca ?? '',
        temperatura: data.temperatura ?? '',
        saturacion_oxigeno: data.saturacion_oxigeno ?? '',
        peso_kg: data.peso_kg ?? '',
        talla_cm: data.talla_cm ?? ''
        });
    } else {

        setFormData({
        presion_sistolica: '',
        presion_diastolica: '',
        frecuencia_cardiaca: '',
        temperatura: '',
        saturacion_oxigeno: '',
        peso_kg: '',
        talla_cm: ''
        });
    }
    }, [data]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    console.log('Guardando signos vitales:', formData);

    if (!formData.presion_sistolica || !formData.presion_diastolica) {
      Swal.fire('Atención', 'Por favor ingresa al menos la presión arterial', 'warning');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="form vital-signs-form">
        <label>
            Presión Sistólica (mmHg) 
            <input 
                type="number" 
                name="presion_sistolica" 
                value={formData.presion_sistolica} 
                onChange={handleChange} 
                placeholder="120" 
            />
        </label>
        
        <label>
            Presión Diastólica (mmHg) 
            <input 
                type="number" 
                name="presion_diastolica" 
                value={formData.presion_diastolica} 
                onChange={handleChange} 
                placeholder="80" 
            />
        </label>

        <label>
            Frecuencia Cardíaca (lpm) 
            <input 
                type="number" 
                name="frecuencia_cardiaca" 
                value={formData.frecuencia_cardiaca} 
                onChange={handleChange} 
                placeholder="70" 
            />
        </label>

        <label>
            Temperatura (°C) 
            <input 
                type="number" 
                step="0.1" 
                name="temperatura" 
                value={formData.temperatura} 
                onChange={handleChange} 
                placeholder="36.5" 
            />
        </label>

        <label>
            Saturación O₂ (%) 
            <input 
                type="number" 
                name="saturacion_oxigeno" 
                value={formData.saturacion_oxigeno} 
                onChange={handleChange} 
                placeholder="98" 
            />
        </label>

        <label>
            Peso (kg) 
            <input 
                type="number" 
                step="0.1" 
                name="peso_kg" 
                value={formData.peso_kg} 
                onChange={handleChange} 
                placeholder="70.5" 
            />
        </label>

        <label>
            Talla (cm) 
            <input 
                type="number" 
                name="talla_cm" 
                value={formData.talla_cm} 
                onChange={handleChange} 
                placeholder="170" 
            />
        </label>
        <div className="form-actions">
            <button type="button" onClick={handleSubmit} className="btn-submit">
                {data ? 'Actualizar' : 'Registrar'} Signos Vitales
            </button>
            <button type="button" onClick={onClose} className="btn-cancel">
                Cancelar
            </button>
        </div>
    </div>
  );
}; 

export default VitalSignsForm;