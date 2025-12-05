import React from 'react';
import {FaExclamationTriangle } from 'react-icons/fa';

const BackgroundsViewModal = ({ antecedentes }) => {
  return (
    <div className="modal-view-content">
      <div className="card-body-patient">
        {antecedentes.length === 0 ? (
          <div className="empty-state">
            <FaExclamationTriangle className="empty-icon" />
            <p>No hay antecedentes médicos registrados para este paciente</p>
          </div>
        ) : (
          <div className="items-list">
            {antecedentes.map((antecedente) => (
              <div key={antecedente.id} className="item-card">
                <div className="item-header">
                  <h3>{antecedente.tipo}</h3>
                </div>
                <div className="item-body">
                  <p className="item-description">{antecedente.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; export default BackgroundsViewModal;