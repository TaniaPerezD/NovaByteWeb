import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaFilePdf, FaTimes } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { generarHistoriaClinicaPDF } from '../../redux/reportes/reportesSlice';

const HistoriaClinicaModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.reportes);

  const [filters, setFilters] = useState({
    paciente_id: '',
    fecha_desde: '',
    fecha_hasta: '',
    incluir_antecedentes: true,
    incluir_alergias: true,
    incluir_examenes: true
  });

  const handleChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!filters.paciente_id.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo Requerido',
        text: 'El ID del paciente es obligatorio',
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

      const result = await dispatch(generarHistoriaClinicaPDF(filters)).unwrap();

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
      setFilters({
        paciente_id: '',
        fecha_desde: '',
        fecha_hasta: '',
        incluir_antecedentes: true,
        incluir_alergias: true,
        incluir_examenes: true
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
          <h2>Generar Historia Clínica PDF</h2>
          <button className="btn-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="modal-body-reportes">
          <div className="reporte-form">
            <div className="form-group-reportes">
              <label>ID del Paciente *</label>
              <input
                type="text"
                value={filters.paciente_id}
                onChange={(e) => handleChange('paciente_id', e.target.value)}
                placeholder="Ingrese ID del paciente"
                disabled={loading}
              />
            </div>

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

            <div className="checkbox-group-reportes">
              <label className="checkbox-label-reportes">
                <input
                  type="checkbox"
                  checked={filters.incluir_antecedentes}
                  onChange={(e) => handleChange('incluir_antecedentes', e.target.checked)}
                  disabled={loading}
                />
                <span>Incluir Antecedentes</span>
              </label>
              <label className="checkbox-label-reportes">
                <input
                  type="checkbox"
                  checked={filters.incluir_alergias}
                  onChange={(e) => handleChange('incluir_alergias', e.target.checked)}
                  disabled={loading}
                />
                <span>Incluir Alergias</span>
              </label>
              <label className="checkbox-label-reportes">
                <input
                  type="checkbox"
                  checked={filters.incluir_examenes}
                  onChange={(e) => handleChange('incluir_examenes', e.target.checked)}
                  disabled={loading}
                />
                <span>Incluir Exámenes</span>
              </label>
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

export default HistoriaClinicaModal;