import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FaStethoscope,
  FaFlask,
  FaHeartbeat,
  FaPrescriptionBottleAlt,
  FaDiagnoses,
  FaClipboardList,
  FaAllergies,
  FaHistory
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import Modal from '../../components/Forms/Modal';
import MedicalConsultationForm from '../../components/Forms/Formularios/MedicalConsultationForm';
import ExamForm from '../../components/Forms/Formularios/ExamForm';
import ExamResultForm from '../../components/Forms/Formularios/ExamResultForm';
import VitalSignsForm from '../../components/Forms/Formularios/VitalSignsForm';
import PrescriptionForm from '../../components/Forms/Formularios/PrescriptionForm';
import PrescriptionItemForm from '../../components/Forms/Formularios/PrescriptionItemForm';
import DiagnosisForm from '../../components/Forms/Formularios/DiagnosisForm';

import ConsultationTab from './tabs/ConsultationTab';
import ExamsTab from './tabs/ExamsTab';
import VitalSignsTab from './tabs/VitalSignsTab';
import PrescriptionTab from './tabs/PrescriptionTab';
import DiagnosisTab from './tabs/DiagnosisTab';
import FirstConsultationTab from './tabs/FirstConsultationTab';
import AllergiesViewModal from './AllergiesViewModal';
import BackgroundsViewModal from './BackgroundsViewModal';

import {
  fetchConsultationDetail,
  updateConsultation,
  createExam,
  updateExam,
  createExamResult,
  updateExamResult,
  saveVitalSigns,
  savePrescription,
  createPrescriptionItem,
  updatePrescriptionItem,
  createDiagnosis,
  updateDiagnosis,
  clearConsultationDetail
} from '../../redux/consultation/consultationDetailSlice';

import {
  listenToConsultationChanges,
  listenToExamsChanges,
  listenToExamResultsChanges,
  listenToVitalSignsChanges,
  listenToPrescriptionChanges,
  listenToPrescriptionItemsChanges,
  listenToDiagnosisChanges
} from '../../services/consultationDetailListener';

const ConsultationDetailView = () => {
  const [activeTab, setActiveTab] = useState('consultation');
  const [modalState, setModalState] = useState({ 
    isOpen: false, 
    type: null, 
    data: null, 
    parentId: null 
  });

  const { id: patientId, consultaId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    consultation,
    firstConsultation,
    isFirstConsultation,
    allergies,
    backgrounds,
    loading,
    error
  } = useSelector((state) => state.consultationDetail);

  // Cargar datos al montar
  useEffect(() => {
    dispatch(fetchConsultationDetail({ 
      pacienteId: patientId, 
      consultaId 
    }));

    return () => {
      dispatch(clearConsultationDetail());
    };
  }, [dispatch, patientId, consultaId]);

  // Listeners en tiempo real
  useEffect(() => {
    if (!consultaId) return;

    const unsubscribeConsultation = listenToConsultationChanges(
      consultaId,
      () => dispatch(fetchConsultationDetail({ pacienteId: patientId, consultaId }))
    );

    const unsubscribeExams = listenToExamsChanges(
      consultaId,
      () => dispatch(fetchConsultationDetail({ pacienteId: patientId, consultaId }))
    );

    const unsubscribeExamResults = listenToExamResultsChanges(
      () => dispatch(fetchConsultationDetail({ pacienteId: patientId, consultaId }))
    );

    const unsubscribeVitalSigns = listenToVitalSignsChanges(
      consultaId,
      () => dispatch(fetchConsultationDetail({ pacienteId: patientId, consultaId }))
    );

    const unsubscribePrescription = listenToPrescriptionChanges(
      consultaId,
      () => dispatch(fetchConsultationDetail({ pacienteId: patientId, consultaId }))
    );

    const unsubscribePrescriptionItems = listenToPrescriptionItemsChanges(
      () => dispatch(fetchConsultationDetail({ pacienteId: patientId, consultaId }))
    );

    const unsubscribeDiagnosis = listenToDiagnosisChanges(
      consultaId,
      () => dispatch(fetchConsultationDetail({ pacienteId: patientId, consultaId }))
    );

    return () => {
      unsubscribeConsultation();
      unsubscribeExams();
      unsubscribeExamResults();
      unsubscribeVitalSigns();
      unsubscribePrescription();
      unsubscribePrescriptionItems();
      unsubscribeDiagnosis();
    };
  }, [dispatch, patientId, consultaId]);

  // Manejo de errores
  useEffect(() => {
    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error,
        confirmButtonText: 'Volver al historial'
      }).then(() => {
        navigate(`/paciente-perfil/${patientId}/historial-medico`);
      });
    }
  }, [error, navigate, patientId]);

  const openModal = (type, data = null, parentId = null) => {
    setModalState({ isOpen: true, type, data, parentId });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, data: null, parentId: null });
  };

  // Handlers
  const handleSaveConsultation = async (data) => {
    try {
      await dispatch(updateConsultation({
        consultaId,
        consultationData: data
      })).unwrap();
      closeModal();
      Swal.fire('Guardado', 'Consulta actualizada correctamente', 'success');
    } catch (error) {
      Swal.fire('Error', error || 'No se pudo actualizar la consulta', 'error');
    }
  };

  const handleSaveExam = async (examData) => {
    try {
      if (modalState.data) {
        await dispatch(updateExam({
          examId: modalState.data.id,
          examData
        })).unwrap();
      } else {
        await dispatch(createExam({
          consultaId,
          examData
        })).unwrap();
      }
      closeModal();
      Swal.fire('Guardado', 'Examen guardado correctamente', 'success');
    } catch (error) {
      Swal.fire('Error', error || 'No se pudo guardar el examen', 'error');
    }
  };

  const handleSaveExamResult = async (resultData) => {
    try {
      const examId = modalState.parentId;
      
      if (modalState.data) {
        await dispatch(updateExamResult({
          resultId: modalState.data.id,
          examId,
          resultData
        })).unwrap();
      } else {
        await dispatch(createExamResult({
          examId,
          resultData
        })).unwrap();
      }
      closeModal();
      Swal.fire('Guardado', 'Resultado guardado correctamente', 'success');
    } catch (error) {
      Swal.fire('Error', error || 'No se pudo guardar el resultado', 'error');
    }
  };

  const handleSaveVitalSigns = async (data) => {
    try {
      await dispatch(saveVitalSigns({
        consultaId,
        vitalSignsData: data,
        existingId: consultation?.vitalSigns?.id
      })).unwrap();
      closeModal();
      Swal.fire('Guardado', 'Signos vitales guardados correctamente', 'success');
    } catch (error) {
      Swal.fire('Error', error || 'No se pudieron guardar los signos vitales', 'error');
    }
  };

  const handleSavePrescription = async (data) => {
    try {
      await dispatch(savePrescription({
        consultaId,
        prescriptionData: data,
        existingId: consultation?.prescription?.id
      })).unwrap();
      closeModal();
      Swal.fire('Guardado', 'Receta guardada correctamente', 'success');
    } catch (error) {
      Swal.fire('Error', error || 'No se pudo guardar la receta', 'error');
    }
  };

  const handleSavePrescriptionItem = async (itemData) => {
    try {
      if (!consultation?.prescription?.id) {
        Swal.fire('Error', 'Primero debe crear la receta médica', 'error');
        return;
      }

      if (modalState.data) {
        await dispatch(updatePrescriptionItem({
          itemId: modalState.data.id,
          itemData
        })).unwrap();
      } else {
        await dispatch(createPrescriptionItem({
          recetaId: consultation.prescription.id,
          itemData
        })).unwrap();
      }
      closeModal();
      Swal.fire('Guardado', 'Medicamento guardado correctamente', 'success');
    } catch (error) {
      Swal.fire('Error', error || 'No se pudo guardar el medicamento', 'error');
    }
  };

  const handleSaveDiagnosis = async (diagnosisData) => {
    try {
      if (modalState.data) {
        await dispatch(updateDiagnosis({
          diagnosisId: modalState.data.id,
          diagnosisData
        })).unwrap();
      } else {
        await dispatch(createDiagnosis({
          consultaId,
          diagnosisData
        })).unwrap();
      }
      closeModal();
      Swal.fire('Guardado', 'Diagnóstico guardado correctamente', 'success');
    } catch (error) {
      Swal.fire('Error', error || 'No se pudo guardar el diagnóstico', 'error');
    }
  };

  // Definir tabs según si es primera consulta o no
  const tabs = isFirstConsultation ? [
    { id: 'consultation', label: 'Consulta', icon: <FaStethoscope /> },
    { id: 'exams', label: 'Exámenes', icon: <FaFlask /> },
    { id: 'vitals', label: 'Signos Vitales', icon: <FaHeartbeat /> },
    { id: 'prescription', label: 'Receta', icon: <FaPrescriptionBottleAlt /> },
    { id: 'diagnosis', label: 'Diagnóstico', icon: <FaDiagnoses /> }
  ] : [
    { id: 'consultation', label: 'Consulta', icon: <FaStethoscope /> },
    { id: 'firstConsultation', label: 'Primera Cita', icon: <FaHistory /> }
  ];

  if (loading && !consultation) {
    return <div className="p-8 text-center">Cargando consulta médica...</div>;
  }

  if (!consultation) {
    return <div className="p-8 text-center">No se encontró la consulta</div>;
  }

  return (
    <div className="consultation-detail-view">
      <div className="page-header">
        <h1><FaClipboardList /> Detalle de Consulta Médica</h1>
        <div className="header-actions">
          <button 
            className="btn-action info" 
            onClick={() => openModal('allergies')}
          >
            <FaAllergies /> Ver Alergias
          </button>
          <button 
            className="btn-action info" 
            onClick={() => openModal('backgrounds')}
          >
            <FaHistory /> Ver Antecedentes
          </button>
        </div>
      </div>

      <div className="tabs-container">
        <div className="tabs-header">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="tabs-body">
          {activeTab === 'consultation' && (
            <ConsultationTab
              data={consultation}
              onEdit={() => openModal('consultation', consultation)}
            />
          )}

          {activeTab === 'firstConsultation' && !isFirstConsultation && firstConsultation && (
            <FirstConsultationTab firstConsultation={firstConsultation} />
          )}

          {isFirstConsultation && activeTab === 'exams' && (
            <ExamsTab
              exams={consultation.exams || []}
              onAddExam={() => openModal('exam')}
              onEditExam={(exam) => openModal('exam', exam)}
              onAddResult={(examId) => openModal('examResult', null, examId)}
              onEditResult={(result, examId) => openModal('examResult', result, examId)}
            />
          )}

          {isFirstConsultation && activeTab === 'vitals' && (
            <VitalSignsTab
              vitalSigns={consultation.vitalSigns}
              onAdd={() => openModal('vitalSigns')}
              onEdit={() => openModal('vitalSigns', consultation.vitalSigns)}
            />
          )}

          {isFirstConsultation && activeTab === 'prescription' && (
            <PrescriptionTab
              prescription={consultation.prescription}
              prescriptionItems={consultation.prescription?.items || []}
              onAddPrescription={() => openModal('prescription')}
              onEditPrescription={() => openModal('prescription', consultation.prescription)}
              onAddItem={() => openModal('prescriptionItem')}
              onEditItem={(item) => openModal('prescriptionItem', item)}
            />
          )}

          {isFirstConsultation && activeTab === 'diagnosis' && (
            <DiagnosisTab
              diagnoses={consultation.diagnoses || []}
              onAdd={() => openModal('diagnosis')}
              onEdit={(diagnosis) => openModal('diagnosis', diagnosis)}
            />
          )}
        </div>
      </div>

      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={
          modalState.type === 'allergies' ? 'Alergias del Paciente' :
          modalState.type === 'backgrounds' ? 'Antecedentes Médicos' :
          modalState.type === 'consultation' ? 'Editar Consulta' :
          modalState.type === 'exam' ? (modalState.data ? 'Editar Examen' : 'Nuevo Examen') :
          modalState.type === 'examResult' ? (modalState.data ? 'Editar Resultado' : 'Nuevo Resultado') :
          modalState.type === 'vitalSigns' ? (modalState.data ? 'Editar Signos Vitales' : 'Registrar Signos Vitales') :
          modalState.type === 'prescription' ? (modalState.data ? 'Editar Receta' : 'Nueva Receta') :
          modalState.type === 'prescriptionItem' ? (modalState.data ? 'Editar Medicamento' : 'Nuevo Medicamento') :
          modalState.type === 'diagnosis' ? (modalState.data ? 'Editar Diagnóstico' : 'Nuevo Diagnóstico') :
          'Modal'
        }
        size={modalState.type === 'consultation' ? 'large' : 'medium'}
      >
        {modalState.type === 'allergies' && (
          <AllergiesViewModal alergias={allergies} />
        )}
        {modalState.type === 'backgrounds' && (
          <BackgroundsViewModal antecedentes={backgrounds} />
        )}
        {modalState.type === 'consultation' && (
          <MedicalConsultationForm
            consultationData={modalState.data}
            onSave={handleSaveConsultation}
            onClose={closeModal}
          />
        )}
        {modalState.type === 'exam' && (
          <ExamForm
            examData={modalState.data}
            onSave={handleSaveExam}
            onClose={closeModal}
          />
        )}
        {modalState.type === 'examResult' && (
          <ExamResultForm
            resultData={modalState.data}
            onSave={handleSaveExamResult}
            onClose={closeModal}
          />
        )}
        {modalState.type === 'vitalSigns' && (
          <VitalSignsForm
            vitalSignsData={modalState.data}
            onSave={handleSaveVitalSigns}
            onClose={closeModal}
          />
        )}
        {modalState.type === 'prescription' && (
          <PrescriptionForm
            prescriptionData={modalState.data}
            onSave={handleSavePrescription}
            onClose={closeModal}
          />
        )}
        {modalState.type === 'prescriptionItem' && (
          <PrescriptionItemForm
            itemData={modalState.data}
            onSave={handleSavePrescriptionItem}
            onClose={closeModal}
          />
        )}
        {modalState.type === 'diagnosis' && (
          <DiagnosisForm
            diagnosisData={modalState.data}
            onSave={handleSaveDiagnosis}
            onClose={closeModal}
          />
        )}
      </Modal>
    </div>
  );
}; export default ConsultationDetailView;
    