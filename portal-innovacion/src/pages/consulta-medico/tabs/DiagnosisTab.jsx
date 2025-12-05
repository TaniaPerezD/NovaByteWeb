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

const DiagnosisTab = ({ diagnoses, onAdd, onEdit, onDelete }) => {
  return (
    <div className="tab-content">
        <div className="content-header">
            <h3>Diagnósticos</h3>
            <button className="btn-action add" onClick={onAdd}>
            <FaPlus /> Nuevo Diagnóstico
            </button>
        </div>
        
        {diagnoses.length === 0 ? (
            <EmptyState 
            message="No hay diagnósticos registrados" 
            onAdd={onAdd} 
            />
        ) : (
            <div className="diagnosis-list">
            {diagnoses.map(diag => (
                <div 
                key={diag.id} 
                className={`diagnosis-card ${diag.principal ? 'principal' : ''}`}
                >
                    <div className="diagnosis-header">
                        <div className="diagnosis-info">
                        <span className="diagnosis-code">{diag.codigo}</span>
                        {diag.principal && (
                            <span className="principal-badge">Principal</span>
                        )}
                        </div>
                        <div className="header-actions">
                        <button 
                            className="btn-icon edit" 
                            onClick={() => onEdit(diag)}
                        >
                            <FaEdit />
                        </button>
                        <button 
                            className="btn-icon delete" 
                            onClick={() => onDelete(diag.id)}
                        >
                            <FaTrash />
                        </button>
                        </div>
                    </div>
                    <div className="diagnosis-description">
                        <span className="description-label">
                        <strong>Descripción:</strong>
                        </span>
                        <span className="diagnosis-description-text">
                        {diag.descripcion}
                        </span>
                    </div>
                </div>
            ))}
            </div>
        )}
    </div>
  );
};

export default DiagnosisTab;