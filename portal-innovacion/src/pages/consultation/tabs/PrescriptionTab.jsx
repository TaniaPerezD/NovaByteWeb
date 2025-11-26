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

const PrescriptionTab = ({ 
  prescription, 
  prescriptionItems, 
  onAddPrescription, 
  onEditPrescription, 
  onDeletePrescription,
  onAddItem,
  onEditItem,
  onDeleteItem 
}) => {
  return (
    <div className="tab-content">
        <div className="content-header">
            <h3>Receta Médica</h3>
            {prescription ? (
            <div className="header-actions">
                <button className="btn-action edit" onClick={onEditPrescription}>
                <FaEdit /> Editar
                </button>
                <button className="btn-action delete" onClick={onDeletePrescription}>
                <FaTrash /> Eliminar
                </button>
            </div>
            ) : (
            <button className="btn-action add" onClick={onAddPrescription}>
                <FaPlus /> Crear Receta
            </button>
            )}
        </div>
        
        {!prescription ? (
            <EmptyState 
            message="No hay receta médica creada" 
            onAdd={onAddPrescription} 
            />
        ) : (
            <div className="prescription-content">
                <div className="prescription-header-info">
                    <p><strong>Fecha:</strong> {prescription.fecha}</p>
                    <p><strong>Indicaciones Generales:</strong> {prescription.indicaciones_generales}</p>
                </div>
                
                <div className="prescription-items">
                    <div className="items-header">
                    <h4>Medicamentos</h4>
                    <button className="btn-small" onClick={onAddItem}>
                        <FaPlus /> Agregar Medicamento
                    </button>
                    </div>
                    
                    {prescriptionItems.length === 0 ? (
                    <p className="no-items">No hay medicamentos agregados</p>
                    ) : (
                    <div className="medications-list">
                        {prescriptionItems.map(item => (
                        <div key={item.id} className="medication-card">
                            <div className="medication-header">
                            <h5>{item.medicamento}</h5>
                            <div className="header-actions">
                                <button 
                                className="btn-icon edit" 
                                onClick={() => onEditItem(item)}
                                >
                                <FaEdit />
                                </button>
                                <button 
                                className="btn-icon delete" 
                                onClick={() => onDeleteItem(item.id)}
                                >
                                <FaTrash />
                                </button>
                            </div>
                            </div>
                            <div className="medication-details">
                            <span><strong>Vía:</strong> {item.via}</span>
                            <span><strong>Dosis:</strong> {item.dosis}</span>
                            <span><strong>Frecuencia:</strong> {item.frecuencia}</span>
                            <span><strong>Duración:</strong> {item.duracion}</span>
                            </div>
                        </div>
                        ))}
                    </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
}; export default PrescriptionTab;