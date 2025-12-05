import { FaCheckCircle, FaTimesCircle, FaEye, FaEdit, FaTrash } from 'react-icons/fa';


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
            <th>Activo</th>
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
              </td><td data-label="Activo">
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: "999px",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  color: "white",
                  backgroundColor: patient.activo ? "#28a745" : "#dc3545",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {patient.activo ? (
                  <FaCheckCircle style={{ color: "white" }} />
                ) : (
                  <FaTimesCircle style={{ color: "white" }} />
                )}
                {patient.activo ? "Activo" : "Inactivo"}
              </span>
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
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}; export default PatientTable;