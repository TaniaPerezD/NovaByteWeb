import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';

const PatientTable = ({ patients, onView, onEdit, onDelete }) => {
  return (
    <div className="table-container-patient">
      <table className="patient-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Apellidos</th>
            <th>Correo Electrónico</th>
            <th>Fecha de Nacimiento</th>
            <th>Ver más</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {patients.map(patient => (
            <tr key={patient.id}>
              <td data-label="Nombre">{patient.nombre}</td>
              <td data-label="Apellidos">{patient.apellidos}</td>
              <td data-label="Correo">{patient.email}</td>
              <td data-label="Fecha de Nacimiento">{patient.fecha_nacimiento}</td>
              <td data-label="Ver más">
                <button
                  className="action-button view"
                  onClick={() => onView(patient.id)}
                  title="Ver detalles"
                >
                  <FaEye />
                </button>
              </td>
              <td data-label="Acciones">
                <div className="action-buttons">
                  <button
                    className="action-button edit"
                    onClick={() => onEdit(patient)}
                    title="Editar"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="action-button delete"
                    onClick={() => onDelete(patient.id)}
                    title="Eliminar"
                  >
                    <FaTrash />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}; export default PatientTable;