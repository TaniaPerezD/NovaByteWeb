import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FaSearch, 
  FaPlus,
  FaFileAlt,
  FaSortAmountDown,
  FaSortAmountUp,
  FaFilePdf
} from 'react-icons/fa';
import Modal from '../../components/Forms/Modal';
import ClinicalArchiveForm from '../../components/Forms/Formularios/ClinicalArchiveForm';
import MedicalConsultationForm from '../../components/Forms/Formularios/MedicalConsultationForm';
import ClinicalArchiveCard from './ClinicalArchiveCard';
import HistoriaClinicaModal from '../reportes/HistoriaClinicaModal';
import Swal from 'sweetalert2';
import {
  fetchClinicalFiles,
  createClinicalFile,
  updateClinicalFile,
  createConsultation,
  clearMedicalHistory,
  fetchPerfilIdByEmail
} from '../../redux/medicalHistory/medicalHistorySlice';
import { 
  listenToClinicalFileChanges, 
  listenToConsultationChanges 
} from '../../services/medicalHistoryListener';

const MedicalHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    data: null,
    fileId: null
  });
  const [historiaClinicaModalOpen, setHistoriaClinicaModalOpen] = useState(false);

  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const patientId = id;

  const { files, loading, error } = useSelector((state) => state.medicalHistory);

  const medicoId = useSelector(state => state.medicalHistory.medicoId);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("nb-user"));
    const email = user?.email;

    if (email) {
      dispatch(fetchPerfilIdByEmail(email));
    }
  }, []);


  // Cargar archivos clínicos al montar el componente
  useEffect(() => {
    dispatch(fetchClinicalFiles(patientId));

    // Cleanup al desmontar
    return () => {
      dispatch(clearMedicalHistory());
    };
  }, [dispatch, patientId]);

  // Listeners en tiempo real
  useEffect(() => {
    // Listener para archivos clínicos
    const unsubscribeFiles = listenToClinicalFileChanges(
      patientId,
      (payload) => {
        // Recargar datos cuando hay cambios
        dispatch(fetchClinicalFiles(patientId));
      }
    );

    // Listener para consultas
    const unsubscribeConsultations = listenToConsultationChanges(
      (payload) => {
        // Recargar datos cuando hay cambios en consultas
        dispatch(fetchClinicalFiles(patientId));
      }
    );

    // Cleanup
    return () => {
      unsubscribeFiles();
      unsubscribeConsultations();
    };
  }, [dispatch, patientId]);

  // Manejo de errores
  useEffect(() => {
    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error,
        confirmButtonText: 'Volver al perfil'
      }).then(() => {
        navigate(`/paciente-perfil/${patientId}`);
      });
    }
  }, [error, navigate, patientId]);

  const filteredAndSortedFiles = useMemo(() => {
    let filtered = files.filter(file =>
      file.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const dateA = new Date(a.fechaCreacion);
      const dateB = new Date(b.fechaCreacion);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [files, searchTerm, sortOrder]);

  const openModal = (type, data = null, fileId = null) => {
    setModalState({ isOpen: true, type, data, fileId });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, data: null, fileId: null });
  };

  const handleSaveFile = async (fileData) => {
    try {
      if (modalState.data) {
        // Actualizar archivo existente
        await dispatch(updateClinicalFile({
          fileId: modalState.data.id,
          fileData
        })).unwrap();

        Swal.fire('Actualizado', 'Archivo clínico actualizado con éxito', 'success');
      } else {
        // Crear nuevo archivo
        await dispatch(createClinicalFile({
          pacienteId: patientId,
          fileData
        })).unwrap();

        Swal.fire('Creado', 'Archivo clínico creado con éxito', 'success');
      }
      closeModal();
    } catch (error) {
      Swal.fire('Error', error || 'No se pudo guardar el archivo', 'error');
    }
  };

  const handleSaveConsultation = async (consultationData) => {
    try {
        
      if (!medicoId) {
        Swal.fire('Error', 'No se pudo identificar al médico. Por favor, inicie sesión nuevamente.', 'error');
        return;
      }

      await dispatch(createConsultation({
        archivoClinicoId: modalState.fileId,
        pacienteId: patientId,
        medicoId: medicoId,
        consultationData
      })).unwrap();

      Swal.fire('Creada', 'Consulta médica registrada con éxito', 'success');
      closeModal();
    } catch (error) {
      Swal.fire('Error', error || 'No se pudo guardar la consulta', 'error');
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  if (loading && files.length === 0) {
    return <div className="p-8 text-center">Cargando historial clínico...</div>;
  }

  return (
    <div className="clinical-files">
      <div className="controls-bar">
        <div className="search-section">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar archivos clínicos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            className="btn-sort" 
            onClick={toggleSortOrder}
            title={sortOrder === 'desc' ? 'Ordenar ascendente' : 'Ordenar descendente'}
          >
            {sortOrder === 'desc' ? <FaSortAmountDown /> : <FaSortAmountUp />}
            {sortOrder === 'desc' ? 'Más recientes' : 'Más antiguos'}
          </button>
        </div>
        <div className="action-buttons">
          <button 
            className="btn-new-file" 
            onClick={() => setHistoriaClinicaModalOpen(true)}
          >
            <FaFilePdf /> Generar Historia Clínica PDF
          </button>
          <button className="btn-new-file" onClick={() => openModal('file')}>
            <FaPlus /> Nuevo Archivo Clínico
          </button>
        </div>
      </div>

      <div className="files-container">
        {filteredAndSortedFiles.length === 0 ? (
          <div className="empty-state">
            <FaFileAlt className="empty-icon" />
            <p>No se encontraron archivos clínicos</p>
          </div>
        ) : (
          filteredAndSortedFiles.map(file => (
            <ClinicalArchiveCard
              key={file.id}
              file={file}
              onEdit={(file) => openModal('file', file)}
              onAddConsultation={(fileId) => openModal('consultation', null, fileId)}
              onViewDetails={(consultaId) => {
                if (consultaId) {
                  window.open(`/paciente-perfil/${patientId}/historial-medico/consulta/${consultaId}`, '_blank');
                } else {
                  Swal.fire('Info', 'Este archivo no tiene consultas aún', 'info');
                }
              }}
              isFirst={filteredAndSortedFiles[0].id === file.id}
            />
          ))
        )}
      </div>

      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={
          modalState.type === 'file' 
            ? (modalState.data ? 'Editar Archivo Clínico' : 'Nuevo Archivo Clínico')
            : 'Nueva Consulta Médica'
        }
        size={modalState.type === 'consultation' ? 'large' : 'medium'}
      >
        {modalState.type === 'file' && (
          <ClinicalArchiveForm
            fileData={modalState.data}
            onSave={handleSaveFile}
            onClose={closeModal}
          />
        )}
        {modalState.type === 'consultation' && (
          <MedicalConsultationForm
            consultationData={null}
            onSave={handleSaveConsultation}
            onClose={closeModal}
          />
        )}
      </Modal>

      <HistoriaClinicaModal
        isOpen={historiaClinicaModalOpen}
        onClose={() => setHistoriaClinicaModalOpen(false)}
        pacienteId={patientId}
      />
    </div>
  );
}; export default MedicalHistory;