import { FaEdit, FaPlus, FaTrash, FaAllergies, FaExclamationTriangle } from 'react-icons/fa';


const AllergiesSection = ({ alergias, onEdit, onAdd, onDelete }) => {
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
    <div className="section-card">
      <div className="card-header">
        <div className="header-content">
          <FaAllergies className="header-icon" />
          <h2>Alergias</h2>
        </div>
        <button className="btn-add" onClick={onAdd}>
          <FaPlus /> Nueva Alergia
        </button>
      </div>
      <div className="card-body-patient">
        {alergias.length === 0 ? (
          <div className="empty-state">
            <FaExclamationTriangle className="empty-icon" />
            <p>No hay datos en este campo</p>
          </div>
        ) : (
          <div className="items-list">
            {alergias.map((alergia) => (
              <div key={alergia.id} className="item-card">
                <div className="item-header">
                  <h3>{alergia.sustancia}</h3>
                  <div className="item-actions">
                    <button className="btn-icon edit" onClick={() => onEdit(alergia)}>
                      <FaEdit />
                    </button>
                    <button className="btn-icon delete" onClick={() => onDelete(alergia.id)}>
                      <FaTrash />
                    </button>
                  </div>
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
}; export default AllergiesSection;