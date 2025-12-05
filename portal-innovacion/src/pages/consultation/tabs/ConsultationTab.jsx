import React from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';

const ConsultationTab = ({ data, onEdit, onDelete }) => {
  return (
    <div className="tab-content">
        <div className="content-header">
            <h3>Datos de la Consulta</h3>
            <div className="header-actions">
            <button className="btn-action edit" onClick={onEdit}>
                <FaEdit /> Editar
            </button>
            <button className="btn-action delete" onClick={onDelete}>
                <FaTrash /> Eliminar
            </button>
            </div>
        </div>
        <div className="consultation-data">
            <div className="data-item">
            <strong>Motivo:</strong> 
            <p>{data.motivo}</p>
            </div>
            <div className="data-item">
            <strong>Anamnesis:</strong> 
            <p>{data.anamnesis}</p>
            </div>
            <div className="data-item">
            <strong>Examen Físico:</strong> 
            <p>{data.examen_fisico}</p>
            </div>
            <div className="data-item">
            <strong>Plan de Tratamiento:</strong> 
            <p>{data.plan}</p>
            </div>
            {data.observaciones && (
            <div className="data-item">
                <strong>Observaciones:</strong> 
                <p>{data.observaciones}</p>
            </div>
            )}
            <div className="data-item">
            <strong>Fecha:</strong> 
            <p>{data.fecha}</p>
            </div>
        </div>
    </div>
  );
}; export default ConsultationTab;