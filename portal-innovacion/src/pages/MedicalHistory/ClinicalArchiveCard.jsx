import React, { useState } from 'react';
import { FaFileAlt, FaEdit, FaTrash, FaCalendarPlus, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import Swal from 'sweetalert2';
import ConsultationItem from './ConsultationItem';

const ClinicalArchiveCard = ({ file, onEdit, onDelete, onAddConsultation, onViewDetails }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDelete = () => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Este archivo y todas sus consultas serán eliminados",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E79796',
      cancelButtonColor: '#E25B5B',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        onDelete(file.id);
        Swal.fire('Eliminado', 'El archivo clínico ha sido eliminado.', 'success');
      }
    });
  };

  return (
    <div className="clinical-file-card">
      <div className="file-header">
        <div className="file-info">
          <div className="file-icon-container">
            <FaFileAlt className="file-icon-item" />
          </div>
          <div className="file-details">
            <h3>{file.tipo}</h3>
            <span className="file-date">Creado: {file.fechaCreacion}</span>
          </div>
        </div>
        <div className="file-actions">
          <button className="btn-action edit" onClick={() => onEdit(file)} title="Editar">
            <FaEdit />
          </button>
          <button className="btn-action add" onClick={() => onAddConsultation(file.id)} title="Nueva Consulta">
            <FaCalendarPlus />
          </button>
          <button className="btn-action delete" onClick={handleDelete} title="Eliminar">
            <FaTrash />
          </button>
          <button 
            className="btn-action expand" 
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Colapsar' : 'Expandir'}
          >
            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
      </div>

      <p className="file-description">{file.descripcion}</p>

      {isExpanded && (
        <div className="consultations-list">
          <div className="consultations-header">
            <h4>Consultas Médicas ({file.consultas.length})</h4>
          </div>
          {file.consultas.length === 0 ? (
            <p className="no-consultations">No hay consultas registradas en este archivo</p>
          ) : (
            <div className="consultations-grid">
              {file.consultas.map((consulta, index) => (
                <ConsultationItem key={consulta.id} consulta={consulta} index={index} handleViewDetails={onViewDetails} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}; export default ClinicalArchiveCard;