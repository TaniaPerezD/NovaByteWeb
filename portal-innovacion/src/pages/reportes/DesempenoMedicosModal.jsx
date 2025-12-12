import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaFilePdf, FaFileExcel, FaTimes } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { 
  generarDesempenoMedicosPDF,
  generarDesempenoMedicosExcel 
} from '../../redux/reportes/reportesSlice';

const DesempenoMedicosModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.reportes);

  const [filters, setFilters] = useState({
    fecha_desde: '',
    fecha_hasta: ''
  });

  const handleChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async (formato) => {
    try {
      Swal.fire({
        title: 'Generando Reporte',
        html: `Por favor espere mientras se genera el reporte en formato ${formato}...`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const action = formato === 'PDF' 
        ? generarDesempenoMedicosPDF 
        : generarDesempenoMedicosExcel;

      const result = await dispatch(action(filters)).unwrap();

      Swal.close();

      await Swal.fire({
        icon: 'success',
        title: 'Reporte Generado',
        html: `
          <p>El reporte de desempeño de médicos se ha generado correctamente</p>
          <p><strong>Archivo:</strong> ${result.fileName}</p>
          <p><strong>Formato:</strong> ${result.formato}</p>
          <p><strong>Fecha:</strong> ${new Date(result.generado_en).toLocaleString()}</p>
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
        text: error || 'No se pudo generar el reporte',
        confirmButtonColor: '#E79796'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-reportes" onClick={onClose}>
      <div className="modal-content-reportes" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-reportes">
          <h2>Generar Reporte de Desempeño de Médicos</h2>
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
                <strong>Información:</strong> Este reporte incluye estadísticas detalladas de todos los médicos:
              </p>
              <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
                <li>Total de consultas realizadas</li>
                <li>Número de pacientes únicos atendidos</li>
                <li>Promedio de consultas por día</li>
                <li>Diagnósticos más frecuentes</li>
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
                onClick={() => handleGenerate('PDF')} 
                className="btn-download-reportes btn-pdf"
                disabled={loading}
              >
                <FaFilePdf /> {loading ? 'Generando...' : 'Descargar PDF'}
              </button>
              <button 
                type="button" 
                onClick={() => handleGenerate('Excel')} 
                className="btn-download-reportes btn-excel"
                disabled={loading}
              >
                <FaFileExcel /> {loading ? 'Generando...' : 'Descargar Excel'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesempenoMedicosModal;