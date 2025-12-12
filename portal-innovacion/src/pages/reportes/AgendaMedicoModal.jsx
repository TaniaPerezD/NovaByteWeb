import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaFilePdf, FaTimes } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { generarAgendaMedicoPDF } from '../../redux/reportes/reportesSlice';

const AgendaMedicoModal = ({ isOpen, onClose, medicoId }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.reportes);

  const [filters, setFilters] = useState({
    fecha_desde: '',
    fecha_hasta: '',
    incluir_estado: ['programada', 'completada', 'cancelada']
  });

  const handleChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleEstadoChange = (estado) => {
    setFilters(prev => ({
      ...prev,
      incluir_estado: prev.incluir_estado.includes(estado)
        ? prev.incluir_estado.filter(e => e !== estado)
        : [...prev.incluir_estado, estado]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!medicoId) {
      Swal.fire({
        icon: 'warning',
        title: 'Error',
        text: 'No se pudo identificar al médico',
        confirmButtonColor: '#E79796'
      });
      return;
    }

    if (filters.incluir_estado.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Selección Requerida',
        text: 'Debe seleccionar al menos un estado de cita',
        confirmButtonColor: '#E79796'
      });
      return;
    }

    try {
      Swal.fire({
        title: 'Generando Reporte',
        html: 'Por favor espere mientras se genera el reporte...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Agregar el medicoId a los filtros antes de enviar
      const filtrosCompletos = {
        ...filters,
        medico_id: medicoId
      };

      const result = await dispatch(generarAgendaMedicoPDF(filtrosCompletos)).unwrap();

      Swal.close();

      await Swal.fire({
        icon: 'success',
        title: 'Reporte Generado',
        html: `
          <p>El reporte se ha generado correctamente</p>
          <p><strong>Archivo:</strong> ${result.fileName}</p>
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
      // Reset filtros
      setFilters({
        fecha_desde: '',
        fecha_hasta: '',
        incluir_estado: ['programada', 'completada', 'cancelada']
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
          <h2>Generar Agenda Médico PDF</h2>
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

            <div className="form-group-reportes">
              <label>Estados de Citas</label>
              <div className="checkbox-group-reportes">
                <label className="checkbox-label-reportes">
                  <input
                    type="checkbox"
                    checked={filters.incluir_estado.includes('programada')}
                    onChange={() => handleEstadoChange('programada')}
                    disabled={loading}
                  />
                  <span>Programada</span>
                </label>
                <label className="checkbox-label-reportes">
                  <input
                    type="checkbox"
                    checked={filters.incluir_estado.includes('completada')}
                    onChange={() => handleEstadoChange('completada')}
                    disabled={loading}
                  />
                  <span>Completada</span>
                </label>
                <label className="checkbox-label-reportes">
                  <input
                    type="checkbox"
                    checked={filters.incluir_estado.includes('cancelada')}
                    onChange={() => handleEstadoChange('cancelada')}
                    disabled={loading}
                  />
                  <span>Cancelada</span>
                </label>
              </div>
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

export default AgendaMedicoModal;