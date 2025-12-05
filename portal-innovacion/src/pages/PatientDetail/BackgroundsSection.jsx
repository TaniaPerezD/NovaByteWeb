import { FaEdit, FaPlus, FaTrash, FaClipboardList, FaExclamationTriangle } from 'react-icons/fa';


const BackgroundsSection = ({ antecedentes, onEdit, onAdd, onDelete }) => {
  return (
    <div className="section-card">
      <div className="card-header">
        <div className="header-content">
          <FaClipboardList className="header-icon" />
          <h2>Antecedentes Médicos</h2>
        </div>
        <button className="btn-add" onClick={onAdd}>
          <FaPlus /> Nuevo Antecedente
        </button>
      </div>
      <div className="card-body-patient">
        {antecedentes.length === 0 ? (
          <div className="empty-state">
            <FaExclamationTriangle className="empty-icon" />
            <p>No hay datos en este campo</p>
          </div>
        ) : (
          <div className="items-list">
            {antecedentes.map((antecedente) => (
              <div key={antecedente.id} className="item-card">
                <div className="item-header">
                  <h3>{antecedente.tipo}</h3>
                  <div className="item-actions">
                    <button className="btn-icon edit" onClick={() => onEdit(antecedente)}>
                      <FaEdit />
                    </button>
                    <button className="btn-icon delete" onClick={() => onDelete(antecedente.id)}>
                      <FaTrash />
                    </button>
                  </div>
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
}; export default BackgroundsSection;