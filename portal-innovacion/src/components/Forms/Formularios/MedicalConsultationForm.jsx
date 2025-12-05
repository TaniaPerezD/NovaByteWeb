import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const MedicalConsultationForm = ({ consultationData, onSave, onClose }) => {
  const [formData, setFormData] = useState(consultationData || {
    motivo: '',
    examen_fisico: '',
    anamnesis: '',
    plan: '',
    observaciones: ''
  });

  useEffect(() => {
    if (consultationData) {
      setFormData({
        motivo: consultationData.motivo || '',
        anamnesis: consultationData.anamnesis || '',
        examen_fisico: consultationData.examen_fisico || '',
        plan: consultationData.plan || '',
        observaciones: consultationData.observaciones || ''
      });
    }
  }, [consultationData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    const { motivo, examen_fisico, anamnesis, plan } = formData;

    if (!motivo || !examen_fisico || !anamnesis || !plan) {
      Swal.fire('Error', 'Los campos motivo, examen físico, anamnesis y plan son obligatorios.', 'error');
      return;
    }

    Swal.fire('Éxito', 'Consulta médica registrada correctamente.', 'success');
    onSave(formData);
    
    onClose();
  };

  return (
    <div className="form consultation-form">
      <label>
        Motivo de Consulta *
        <input
          type="text"
          name="motivo"
          value={formData.motivo}
          onChange={handleChange}
          placeholder="Describe el motivo principal de la consulta"
          required
        />
      </label>

      <label>
        Examen Físico *
        <textarea
          name="examen_fisico"
          value={formData.examen_fisico}
          onChange={handleChange}
          placeholder="Signos vitales, hallazgos del examen físico..."
          rows="4"
          required
        ></textarea>
      </label>

      <label>
        Anamnesis *
        <textarea
          name="anamnesis"
          value={formData.anamnesis}
          onChange={handleChange}
          placeholder="Historia clínica, antecedentes relevantes, evolución del cuadro..."
          rows="4"
          required
        ></textarea>
      </label>

      <label>
        Plan de Tratamiento *
        <textarea
          name="plan"
          value={formData.plan}
          onChange={handleChange}
          placeholder="Indicaciones médicas, medicamentos, estudios solicitados..."
          rows="4"
          required
        ></textarea>
      </label>

      <label>
        Observaciones
        <textarea
          name="observaciones"
          value={formData.observaciones}
          onChange={handleChange}
          placeholder="Información adicional, recomendaciones, próxima cita..."
          rows="3"
        ></textarea>
      </label>

      <div className="form-actions">
        <button type="button" onClick={handleSubmit} className="btn-submit">
          {consultationData ? 'Actualizar' : 'Guardar'} Consulta
        </button>
        <button type="button" onClick={onClose} className="btn-cancel">
          Cancelar
        </button>
      </div>
    </div>
  );
}; export default MedicalConsultationForm;