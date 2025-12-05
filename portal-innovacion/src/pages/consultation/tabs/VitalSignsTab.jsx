import React from 'react';
import { FaEdit, FaTrash, FaPlus, FaExclamationTriangle } from 'react-icons/fa';

const EmptyState = ({ message, onAdd }) => (
  <div className="empty-state-tab">
    <FaExclamationTriangle className="empty-icon" />
    <p>{message}</p>
    <button className="btn-add-primary" onClick={onAdd}>
      <FaPlus /> Agregar
    </button>
  </div>
);

const VitalSignsTab = ({ vitalSigns, onAdd, onEdit, onDelete }) => {
  return (
    <div className="tab-content">
        <div className="content-header">
            <h3>Signos Vitales</h3>
            {vitalSigns ? (
            <div className="header-actions">
                <button className="btn-action edit" onClick={onEdit}>
                <FaEdit /> Editar
                </button>
                <button className="btn-action delete" onClick={onDelete}>
                <FaTrash /> Eliminar
                </button>
            </div>
            ) : (
            <button className="btn-action add" onClick={onAdd}>
                <FaPlus /> Registrar
            </button>
            )}
        </div>
        
        {!vitalSigns ? (
            <EmptyState 
            message="No hay signos vitales registrados" 
            onAdd={onAdd} 
            />
        ) : (
            <div className="vital-signs-grid">
                <div className="vital-item">
                    <span className="vital-label">Presión Arterial:</span>
                    <span className="vital-value">
                    {vitalSigns.presion_sistolica}/{vitalSigns.presion_diastolica} mmHg
                    </span>
                </div>
                <div className="vital-item">
                    <span className="vital-label">Frecuencia Cardíaca:</span>
                    <span className="vital-value">{vitalSigns.frecuencia_cardiaca} lpm</span>
                </div>
                <div className="vital-item">
                    <span className="vital-label">Temperatura:</span>
                    <span className="vital-value">{vitalSigns.temperatura} °C</span>
                </div>
                <div className="vital-item">
                    <span className="vital-label">Saturación O₂:</span>
                    <span className="vital-value">{vitalSigns.saturacion_oxigeno}%</span>
                </div>
                <div className="vital-item">
                    <span className="vital-label">Peso:</span>
                    <span className="vital-value">{vitalSigns.peso_kg} kg</span>
                </div>
                <div className="vital-item">
                    <span className="vital-label">Talla:</span>
                    <span className="vital-value">{vitalSigns.talla_cm} cm</span>
                </div>
            </div>
        )}
    </div>
  );
};

export default VitalSignsTab;