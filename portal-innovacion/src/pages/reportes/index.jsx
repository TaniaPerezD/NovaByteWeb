import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FaChartBar, 
  FaClipboardList, 
  FaCalendarAlt, 
  FaUserMd,
  FaFilePdf,
  FaFileExcel,
  FaHistory,
  FaChartLine,
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import HistoriaClinicaModal from './HistoriaClinicaModal';
import AgendaMedicoModal from './AgendaMedicoModal';
import DashboardEstadisticasModal from './DashboardEstadisticasModal';
import DesempenoMedicosModal from './DesempenoMedicosModal';
import { 
  clearError 
} from '../../redux/reportes/reportesSlice';

const Reportes = () => {
  const dispatch = useDispatch();
  const { loading, error, reportes } = useSelector((state) => state.reportes);

  const [modals, setModals] = useState({
    historiaClinica: false,
    agendaMedico: false,
    dashboardEstadisticas: false,
    desempenoMedicos: false
  });

  useEffect(() => {
    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error,
        confirmButtonColor: '#E79796'
      });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const openModal = (modalName) => {
    setModals({ ...modals, [modalName]: true });
  };

  const closeModal = (modalName) => {
    setModals({ ...modals, [modalName]: false });
  };

  const reportCards = [
    {
      id: 'historiaClinica',
      title: 'Historia Clínica',
      description: 'Generar reporte completo del historial médico del paciente con antecedentes, alergias y exámenes',
      icon: <FaClipboardList />,
      color: 'primary',
      formats: ['PDF'],
      action: () => openModal('historiaClinica')
    },
    {
      id: 'agendaMedico',
      title: 'Agenda Médico',
      description: 'Reporte de citas programadas, completadas y canceladas por médico en un período específico',
      icon: <FaCalendarAlt />,
      color: 'secondary',
      formats: ['PDF'],
      action: () => openModal('agendaMedico')
    },
    {
      id: 'dashboardEstadisticas',
      title: 'Dashboard de Estadísticas',
      description: 'Dashboard completo con estadísticas generales del sistema, médicos activos, pacientes y consultas',
      icon: <FaChartLine />,
      color: 'tertiary',
      formats: ['PDF'],
      action: () => openModal('dashboardEstadisticas')
    },
    {
      id: 'desempenoMedicos',
      title: 'Desempeño de Médicos',
      description: 'Estadísticas detalladas de rendimiento, consultas realizadas y diagnósticos frecuentes de todos los médicos',
      icon: <FaUserMd />,
      color: 'quaternary',
      formats: ['PDF', 'Excel'],
      action: () => openModal('desempenoMedicos')
    }
  ];

  return (
    <div className="reportes-container">
      <div className="reportes-header">
        <h1>
          <FaChartBar className="header-icon" />
          Centro de Reportes Médicos
        </h1>
        <p className="subtitle">Genere y descargue reportes detallados del sistema de forma rápida y segura</p>
      </div>

      {reportes.length > 0 && (
        <div className="recent-reports">
          <div className="recent-header">
            <FaHistory />
            <h3>Últimos Reportes Generados</h3>
          </div>
          <div className="recent-list">
            {reportes.slice(0, 3).map((reporte, index) => (
              <div key={index} className="recent-item">
                <div className="recent-info">
                  <span className="recent-name">{reporte.fileName}</span>
                  <span className="recent-date">
                    {new Date(reporte.generado_en).toLocaleString()}
                  </span>
                </div>
                <button 
                  className="btn-recent-download"
                  onClick={() => window.open(`http://localhost:4001${reporte.downloadUrl}`, '_blank')}
                >
                  Descargar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="reportes-grid">
        {reportCards.map(card => (
          <div key={card.id} className={`reporte-card ${card.color}`}>
            <div className="card-icon">
              {card.icon}
            </div>
            <div className="card-content">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
            <div className="card-formats">
              {card.formats.map(format => (
                <span key={format} className="format-badge">
                  {format === 'PDF' ? <FaFilePdf /> : <FaFileExcel />}
                  {format}
                </span>
              ))}
            </div>
            
            <button 
              className="btn-generate"
              onClick={card.action}
              disabled={loading}
            >
              Generar Reporte
            </button>
          </div>
        ))}
      </div>

      {/* Modales */}
      <HistoriaClinicaModal
        isOpen={modals.historiaClinica}
        onClose={() => closeModal('historiaClinica')}
      />
      <AgendaMedicoModal
        isOpen={modals.agendaMedico}
        onClose={() => closeModal('agendaMedico')}
      />
      <DashboardEstadisticasModal
        isOpen={modals.dashboardEstadisticas}
        onClose={() => closeModal('dashboardEstadisticas')}
      />
      <DesempenoMedicosModal
        isOpen={modals.desempenoMedicos}
        onClose={() => closeModal('desempenoMedicos')}
      />
    </div>
  );
};

export default Reportes;