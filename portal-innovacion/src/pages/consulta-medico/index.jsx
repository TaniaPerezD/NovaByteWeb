import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {supabase} from "../../services/supabaseClient";
import { 
  FaStethoscope,
  FaFlask,
  FaHeartbeat,
  FaPrescriptionBottleAlt,
  FaDiagnoses,
  FaClipboardList
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

// import './consultation-detail.scss';

// Datos mock
const mockDataByPatient = {
  1: {
    pacienteId: 1,
    nombre: "Juan Pérez",
    files: [
      {
        id: 1,
        tipo: 'Cardiología',
        descripcion: 'Evaluación cardiovascular completa con electrocardiograma y ecocardiografía.',
        fechaCreacion: '2024-01-15',
        consultas: [
          {
            id: 1,
            motivo: 'Dolor en el pecho y dificultad para respirar',
            examen_fisico: 'Presión arterial: 140/90 mmHg. Frecuencia cardíaca: 88 lpm.',
            anamnesis: 'Paciente refiere dolor opresivo en el pecho de 3 días de evolución.',
            plan: 'Solicitar ecocardiograma doppler, prueba de esfuerzo y perfil lipídico.',
            observaciones: 'Control en 15 días con resultados de estudios.',
            fecha: '2024-01-20',
            exams: [
              {
                id: 1,
                tipo: 'Electrocardiograma',
                indicacion: 'Evaluar ritmo y posibles anomalías cardíacas.',
                resultados: [
                  {
                    id: 1,
                    informe: 'Ritmo sinusal normal. No se observan arritmias.',
                    hallazgo: 'Normal',
                    fecha_resultado: '2024-01-21'
                  },
                  {
                    id: 2,
                    informe: 'Seguimiento post tratamiento. Mejora en conductividad.',
                    hallazgo: 'Mejoría notable',
                    fecha_resultado: '2024-02-01'
                  }
                ]
              }
            ],
            vitalSigns: {
              presion_sistolica: 140,
              presion_diastolica: 90,
              frecuencia_cardiaca: 88,
              temperatura: 36.7,
              saturacion_oxigeno: 97,
              peso_kg: 80,
              talla_cm: 175
            },
            prescription: {
              id: 1,
              fecha: '2024-01-20',
              indicaciones_generales: 'Tomar medicamentos con alimentos. Evitar esfuerzos físicos intensos.',
              items: [
                {
                  id: 1,
                  medicamento: 'Aspirina',
                  via: 'Oral',
                  dosis: '100mg',
                  frecuencia: 'Una vez al día',
                  duracion: 'Indefinido'
                },
                {
                  id: 2,
                  medicamento: 'Atorvastatina',
                  via: 'Oral',
                  dosis: '20mg',
                  frecuencia: 'Una vez al día',
                  duracion: '30 días'
                }
              ]
            },
            diagnoses: [
              {
                id: 1,
                codigo: 'I20.0',
                descripcion: 'Angina de pecho estable',
                principal: true
              },
              {
                id: 2,
                codigo: 'E78.5',
                descripcion: 'Hiperlipidemia no especificada',
                principal: false
              }
            ]
          },
          {
            id: 2,
            motivo: 'Control post tratamiento',
            examen_fisico: 'Presión arterial: 130/85 mmHg. Frecuencia cardíaca: 76 lpm.',
            anamnesis: 'Paciente ha seguido el tratamiento indicado.',
            plan: 'Continuar con medicación actual. Solicitar nuevo ECG en 3 meses.',
            observaciones: 'Paciente muestra buena adherencia al tratamiento.',
            fecha: '2024-02-05',
            exams: [],
            vitalSigns: null,
            prescription: null,
            diagnoses: []
          }
        ]
      }
    ]
  }
};

const ConsultationMedicDetailView = () => {
  
  const { consultaId } = useParams();
  
  const { id } = useParams();
  const navigate = useNavigate();

  const [consultaData, setConsultaData] = useState(null);

  const [activeTab, setActiveTab] = useState('consultation');
  const [consultationData, setConsultationData] = useState(null);
  const [exams, setExams] = useState([]);
  const [vitalSigns, setVitalSigns] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [prescriptionItems, setPrescriptionItems] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [modalState, setModalState] = useState({ 
    isOpen: false, 
    type: null, 
    data: null, 
    parentId: null 
  });

  
  
    // Cargar un solo paciente por ID
    const loadConsultation = async () => {
      const { data, error } = await supabase
        .from("consulta")
        .select("*")
        .eq("id", consultaId)        // aquí usamos el ID dinámico del URL
        .single();           // devuelve solo 1 registro
  
      if (error) {
        Swal.fire({
          icon: 'error',
          title: 'Problema buscando consulta',
          text: 'Hubo un error buscando consulta',
          confirmButtonText: 'Volver a la lista'
        }).then(() => {
          navigate('/citas');
        });
      }
      else if (!data) {
        Swal.fire({
          icon: 'error',
          title: 'Consulta no encontrado',
          text: 'El consulta con este ID no existe, Reintente nuevamente.',
          confirmButtonText: 'Volver a la lista'
        }).then(() => {
          navigate('/citas');
        });
      } else {
        setConsultaData(data);
        console.log("Paci ente cargado:", data);
      }
    };

    
    useEffect(() => {
      if (!consultaId) {
        Swal.fire({
          icon: 'error',
          title: 'ID inválido',
          text: 'No se encontró un ID en la URL.',
          confirmButtonText: 'Volver a la lista'
        }).then(() => {
          navigate('/citas');
        });
        return;
      }
    
      loadConsultation(); // solo la llamas, no intentas usar su retorno
    }, [id]);
    
    const openModal = (type, data = null, parentId = null) => {
        setModalState({ isOpen: true, type, data, parentId });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, type: null, data: null, parentId: null });
    };
    const handleSaveConsultation = async (formData) => {
      try {
        let result;
    
        // consultaData VIENE DE TU SCOPE SUPERIOR
        if (consultaData?.id) {
          // UPDATE consulta existente
          const updatedData = {
            motivo: formData.motivo,
            anamnesis: formData.anamnesis,
            examen_fisico: formData.examen_fisico,
            plan: formData.plan,
            observaciones: formData.observaciones,
    
            cita_id: consultaData.cita_id,
            paciente_id: consultaData.paciente_id,
            medico_id: consultaData.medico_id
          };
    
          result = await supabase
            .from("consulta")
            .update(updatedData)
            .eq("id", consultaData.id)
            .select("*")
            .single();
    
          if (result.error) throw result.error;
    
          Swal.fire("Actualizado", "Consulta actualizada con éxito", "success");
    
        } else {
          // INSERT nueva consulta
          const newData = {
            motivo: formData.motivo,
            anamnesis: formData.anamnesis,
            examen_fisico: formData.examen_fisico,
            plan: formData.plan,
            observaciones: formData.observaciones,
    
            cita_id: consultaData?.cita_id || null,
            paciente_id: consultaData.paciente_id,
            medico_id: consultaData.medico_id
          };
    
          result = await supabase
            .from("consulta")
            .insert(newData)
            .select("*")
            .single();
    
          if (result.error) throw result.error;
    
          Swal.fire("Creado", "Consulta creada con éxito", "success");
        }
    
        await loadConsultation();
        closeModal();
    
      } catch (error) {
        console.error("Error al guardar consulta:", error);
        Swal.fire("Error", error.message || "No se pudo guardar la consulta.", "error");
      }
    };
    
    
    const handleDeleteConsultation = () => {
        Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta consulta será eliminada permanentemente",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#E79796',
        cancelButtonColor: '#E25B5B',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
        }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire('Eliminado', 'La consulta ha sido eliminada.', 'success');
            //navigate(`/paciente-perfil/${patientId}/historial-medico`);
        }
        });
    };

    // Handlers para Exámenes
    const handleSaveExam = (examData) => {
        if (modalState.data) {
        setExams(exams.map(e => 
            e.id === modalState.data.id 
            ? { ...examData, id: e.id, resultados: e.resultados } 
            : e
        ));
        } else {
        const newExam = {
            ...examData,
            id: exams.length > 0 ? Math.max(...exams.map(e => e.id)) + 1 : 1,
            resultados: []
        };
        setExams([...exams, newExam]);
        }
        closeModal();
        Swal.fire('Guardado', 'Examen guardado correctamente', 'success');
    };

    const handleDeleteExam = (id) => {
        Swal.fire({
        title: '¿Eliminar examen?',
        text: "Se eliminarán también todos sus resultados",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#E79796',
        cancelButtonColor: '#E25B5B',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
        }).then((result) => {
        if (result.isConfirmed) {
            setExams(exams.filter(e => e.id !== id));
            Swal.fire('Eliminado', 'Examen eliminado correctamente', 'success');
        }
        });
    };

    const handleSaveExamResult = (resultData) => {
        const examId = modalState.parentId;
        
        setExams(exams.map(exam => {
        if (exam.id === examId) {
            if (modalState.data) {
            return {
                ...exam,
                resultados: exam.resultados.map(r => 
                r.id === modalState.data.id ? { ...resultData, id: r.id } : r
                )
            };
            } else {
            const newResult = {
                ...resultData,
                id: exam.resultados.length > 0 
                ? Math.max(...exam.resultados.map(r => r.id)) + 1 
                : 1,
                fecha_resultado: new Date().toISOString().split('T')[0]
            };
            return {
                ...exam,
                resultados: [...exam.resultados, newResult]
            };
            }
        }
        return exam;
        }));
        
        closeModal();
        Swal.fire('Guardado', 'Resultado guardado correctamente', 'success');
    };

    const handleDeleteExamResult = (examId, resultId) => {
        Swal.fire({
        title: '¿Eliminar resultado?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#E79796',
        cancelButtonColor: '#E25B5B',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
        }).then((result) => {
        if (result.isConfirmed) {
            setExams(exams.map(exam => {
            if (exam.id === examId) {
                return {
                ...exam,
                resultados: exam.resultados.filter(r => r.id !== resultId)
                };
            }
            return exam;
            }));
            Swal.fire('Eliminado', 'Resultado eliminado correctamente', 'success');
        }
        });
    };

    // Handlers para Signos Vitales
    const handleSaveVitalSigns = (data) => {
        setVitalSigns(data);
        closeModal();
        Swal.fire('Guardado', 'Signos vitales guardados correctamente', 'success');
    };

    const handleDeleteVitalSigns = () => {
        Swal.fire({
        title: '¿Eliminar signos vitales?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#E79796',
        cancelButtonColor: '#E25B5B',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
        }).then((result) => {
        if (result.isConfirmed) {
            setVitalSigns(null);
            Swal.fire('Eliminado', 'Signos vitales eliminados', 'success');
        }
        });
    };

    // Handlers para Receta Médica
    const handleSavePrescription = (data) => {
        if (!prescription) {
        const newPrescription = {
            ...data,
            id: 1,
            fecha: new Date().toISOString().split('T')[0]
        };
        setPrescription(newPrescription);
        } else {
        setPrescription({ ...prescription, ...data });
        }
        closeModal();
        Swal.fire('Guardado', 'Receta guardada correctamente', 'success');
    };

    const handleDeletePrescription = () => {
        Swal.fire({
        title: '¿Eliminar receta?',
        text: "Se eliminarán también todos los medicamentos",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#E79796',
        cancelButtonColor: '#E25B5B',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
        }).then((result) => {
        if (result.isConfirmed) {
            setPrescription(null);
            setPrescriptionItems([]);
            Swal.fire('Eliminado', 'Receta eliminada correctamente', 'success');
        }
        });
    };

    const handleSavePrescriptionItem = (itemData) => {
        if (modalState.data) {
        setPrescriptionItems(prescriptionItems.map(item => 
            item.id === modalState.data.id ? { ...itemData, id: item.id } : item
        ));
        } else {
        const newItem = {
            ...itemData,
            id: prescriptionItems.length > 0 
            ? Math.max(...prescriptionItems.map(i => i.id)) + 1 
            : 1
        };
        setPrescriptionItems([...prescriptionItems, newItem]);
        }
        closeModal();
        Swal.fire('Guardado', 'Medicamento guardado correctamente', 'success');
    };

    const handleDeletePrescriptionItem = (id) => {
        Swal.fire({
        title: '¿Eliminar medicamento?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#E79796',
        cancelButtonColor: '#E25B5B',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
        }).then((result) => {
        if (result.isConfirmed) {
            setPrescriptionItems(prescriptionItems.filter(i => i.id !== id));
            Swal.fire('Eliminado', 'Medicamento eliminado correctamente', 'success');
        }
        });
    };

    // Handlers para Diagnósticos
    const handleSaveDiagnosis = (diagnosisData) => {
        if (modalState.data) {
        setDiagnoses(diagnoses.map(d => 
            d.id === modalState.data.id ? { ...diagnosisData, id: d.id } : d
        ));
        } else {
        const newDiagnosis = {
            ...diagnosisData,
            id: diagnoses.length > 0 ? Math.max(...diagnoses.map(d => d.id)) + 1 : 1
        };
        setDiagnoses([...diagnoses, newDiagnosis]);
        }
        closeModal();
        Swal.fire('Guardado', 'Diagnóstico guardado correctamente', 'success');
    };

    const handleDeleteDiagnosis = (id) => {
        Swal.fire({
        title: '¿Eliminar diagnóstico?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#E79796',
        cancelButtonColor: '#E25B5B',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
        }).then((result) => {
        if (result.isConfirmed) {
            setDiagnoses(diagnoses.filter(d => d.id !== id));
            Swal.fire('Eliminado', 'Diagnóstico eliminado correctamente', 'success');
        }
        });
    };
    const tabs = [
        { id: 'consultation', label: 'Consulta', icon: <FaStethoscope /> },
        { id: 'exams', label: 'Exámenes', icon: <FaFlask /> },
        { id: 'vitals', label: 'Signos Vitales', icon: <FaHeartbeat /> },
        { id: 'prescription', label: 'Receta', icon: <FaPrescriptionBottleAlt /> },
        { id: 'diagnosis', label: 'Diagnóstico', icon: <FaDiagnoses /> }
    ];

    if (!consultaData) {
        return <div className="p-8 text-center">Cargando consulta médica...</div>;
    }

  return (
    <div className="consultation-detail-view">
      <div className="page-header">
        <h1><FaClipboardList /> Detalle de Consulta Médica</h1>
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
              data={consultaData}
              onEdit={() => openModal('consultation', consultaData)}
              onDelete={handleDeleteConsultation}
            />
          )}

          {activeTab === 'exams' && (
            <ExamsTab
              exams={exams}
              onAddExam={() => openModal('exam')}
              onEditExam={(exam) => openModal('exam', exam)}
              onDeleteExam={handleDeleteExam}
              onAddResult={(examId) => openModal('examResult', null, examId)}
              onEditResult={(result, examId) => openModal('examResult', result, examId)}
              onDeleteResult={handleDeleteExamResult}
            />
          )}

          {activeTab === 'vitals' && (
            <VitalSignsTab
              vitalSigns={vitalSigns}
              onAdd={() => openModal('vitalSigns')}
              onEdit={() => openModal('vitalSigns', vitalSigns)}
              onDelete={handleDeleteVitalSigns}
            />
          )}

          {activeTab === 'prescription' && (
            <PrescriptionTab
              prescription={prescription}
              prescriptionItems={prescriptionItems}
              onAddPrescription={() => openModal('prescription')}
              onEditPrescription={() => openModal('prescription', prescription)}
              onDeletePrescription={handleDeletePrescription}
              onAddItem={() => openModal('prescriptionItem')}
              onEditItem={(item) => openModal('prescriptionItem', item)}
              onDeleteItem={handleDeletePrescriptionItem}
            />
          )}

          {activeTab === 'diagnosis' && (
            <DiagnosisTab
              diagnoses={diagnoses}
              onAdd={() => openModal('diagnosis')}
              onEdit={(diagnosis) => openModal('diagnosis', diagnosis)}
              onDelete={handleDeleteDiagnosis}
            />
          )}
        </div>
      </div>

      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={
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
        {modalState.type === 'consultation' && (
          <MedicalConsultationForm
            consultaData={modalState.data}
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
}; export default ConsultationMedicDetailView;
    