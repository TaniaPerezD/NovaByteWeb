import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaFilePdf, FaTimes } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { generarDashboardEstadisticasPDF } from '../../redux/reportes/reportesSlice';

const DashboardEstadisticasModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.reportes);

  const [filters, setFilters] = useState({
    fecha_desde: '',
    fecha_hasta: ''
  });

  const handleChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      Swal.fire({
        title: 'Generando Dashboard',
        html: 'Por favor espere mientras se genera el reporte estadístico...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const result = await dispatch(generarDashboardEstadisticasPDF(filters)).unwrap();

      Swal.close();

      await Swal.fire({
        icon: 'success',
        title: 'Dashboard Generado',
        html: `
          <p>El dashboard de estadísticas se ha generado correctamente</p>
          <p><strong>Archivo:</strong> ${result.fileName}</p>
          <p><strong>Fecha:</strong> ${new Date(result.generado_en).toLocaleString()}</p>
          ${result.metadata?.total_registros ? `<p><strong>Total de registros:</strong> ${result.metadata.total_registros}</p>` : ''}
        `,
        showCancelButton: true,
        confirmButtonText: 'Descargar Ahora',
        cancelButtonText: 'Cerrar',
        confirmButtonColor: '#E79796',
        cancelButtonColor: '#6B6B6B'
      }).then((res) => {
        if (res.isConfirmed) {
          window.open(`http://localhost:4001${result.downloadUrl}`, '_blank');
        }
      });

      onClose();
      setFilters({
        fecha_desde: '',
        fecha_hasta: ''
      });

    } catch (error) {
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error || 'No se pudo generar el dashboard',
        confirmButtonColor: '#E79796'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-reportes" onClick={onClose}>
      <div className="modal-content-reportes" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-reportes">
          <h2>Generar Dashboard de Estadísticas PDF</h2>
          <button className="btn-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="modal-body-reportes">
          <div className="reporte-form">
            <div className="form-row-reportes">
              <div className="form-group-reportes">
                <label>Fecha Desde</label>
                <input
                  type="date"
                  value={filters.fecha_desde}
                  onChange={(e) => handleChange('fecha_desde', e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="form-group-reportes">
                <label>Fecha Hasta</label>
                <input
                  type="date"
                  value={filters.fecha_hasta}
                  onChange={(e) => handleChange('fecha_hasta', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="info-box-reportes">
              <p>
                <strong>Información:</strong> Este reporte genera un dashboard completo con estadísticas generales del sistema, incluyendo:
              </p>
              <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
                <li>Total de médicos activos</li>
                <li>Total de pacientes registrados</li>
                <li>Consultas realizadas en el período</li>
                <li>Citas programadas y completadas</li>
              </ul>
            </div>

            <div className="modal-actions-reportes">
              <button 
                type="button" 
                onClick={onClose} 
                className="btn-cancel-reportes"
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleSubmit} 
                className="btn-download-reportes"
                disabled={loading}
              >
                <FaFilePdf /> {loading ? 'Generando...' : 'Descargar PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardEstadisticasModal;