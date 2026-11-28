import { FaEdit, FaUser } from 'react-icons/fa';

const PatientInfo = ({ patient, onEdit }) => {
  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return "";
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);

    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  return (
    <div className="patient-info-card">
      <div className="card-header">
        <div className="header-content">
          <FaUser className="header-icon" />
          <h2>Información del Paciente</h2>
        </div>
        <button className="btn-edit-header" onClick={onEdit}>
          <FaEdit /> Editar
        </button>
      </div>

      <div className="card-body-patient">
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Nombre Completo:</span>
            <span className="info-value">
              {patient.nombre} {patient.apellidos}
            </span>
          </div>

          <div className="info-item">
            <span className="info-label">Correo Electrónico:</span>
            <span className="info-value">{patient.email}</span>
          </div>

          <div className="info-item">
            <span className="info-label">Fecha de Nacimiento:</span>
            <span className="info-value">
              {patient.fecha_nacimiento} ({calcularEdad(patient.fecha_nacimiento)} años)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientInfo;