import { FaEye, FaStar } from 'react-icons/fa';

const ConsultationItem = ({ consulta, index, handleViewDetails, isFirst }) => {
  return (
    <div className={`consultation-item ${isFirst ? 'first-consultation' : ''}`}>
      <div className="consultation-header">
        <span className="consultation-number">
          {isFirst && <FaStar className="first-star" />}
          Consulta #{index + 1}
        </span>
        <span className="consultation-date">{consulta.fecha}</span>
      </div>
      {isFirst && <div className="first-badge">Primera Consulta</div>}
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