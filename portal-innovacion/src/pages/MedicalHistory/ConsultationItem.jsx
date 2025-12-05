import { FaEye } from 'react-icons/fa';

const ConsultationItem = ({ consulta, index, handleViewDetails }) => {
  return (
    <div className="consultation-item">
      <div className="consultation-header">
        <span className="consultation-number">Consulta #{index + 1}</span>
        <span className="consultation-date">{consulta.fecha}</span>
      </div>
      <p className="consultation-motivo">{consulta.motivo}</p>
      <button 
        className="btn-view-details" 
        onClick={() => handleViewDetails(consulta.id)}
      >
        <FaEye /> Ver Detalles
      </button>
    </div>
  );
}; export default ConsultationItem;