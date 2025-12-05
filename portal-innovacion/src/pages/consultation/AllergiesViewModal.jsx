import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

const AllergiesViewModal = ({ alergias }) => {
  const getSeverityClass = (severidad) => {
    switch (severidad) {
      case 'alta': return 'severity-high';
      case 'media': return 'severity-medium';
      case 'baja': return 'severity-low';
      default: return 'severity-low';
    }
  };

  const getSeverityText = (severidad) => {
    switch (severidad) {
      case 'alta': return 'Alta';
      case 'media': return 'Media';
      case 'baja': return 'Baja';
      default: return 'Baja';
    }
  };

  return (
    <div className="modal-view-content">
      <div className="card-body-patient">
        {alergias.length === 0 ? (
          <div className="empty-state">
            <FaExclamationTriangle className="empty-icon" />
            <p>No hay alergias registradas para este paciente</p>
          </div>
        ) : (
          <div className="items-list">
            {alergias.map((alergia) => (
              <div key={alergia.id} className="item-card">
                <div className="item-header">
                  <h3>{alergia.sustancia}</h3>
                </div>
                <div className="item-body">
                  <span className={`severity-badge ${getSeverityClass(alergia.severidad)}`}>
                    Severidad: {getSeverityText(alergia.severidad)}
                  </span>
                  <p className="item-description">{alergia.observacion}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; export default AllergiesViewModal;