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


    console.log("🎬 Componente renderizado - vitalSigns:", vitalSigns);

useEffect(() => {
  console.log("👀 vitalSigns cambió a:", vitalSigns);
}, [vitalSigns]);


    // Cargar un solo paciente por ID
    const loadConsultation = async () => {
      const { data, error } = await supabase
        .from("consulta")
        .select("*")
        .eq("id", consultaId)        
        .single();           
  
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

    const loadExams = async () => {
    try {
      const { data, error } = await supabase
        .from("examen")
        .select("*")
        .eq("consulta_id", consultaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams(data || []);
      console.log("Exámenes cargados:", data);
    } catch (error) {
      console.error("Error al cargar exámenes:", error);
    }
  };

  // Cargar signos vitales
  const loadVitalSigns = async () => {
    console.log("🔵 === INICIO loadVitalSigns ===");
    console.log("🔵 consultaId:", consultaId);
    
    try {
      const { data, error } = await supabase
        .from("signos_vitales")
        .select("*")
        .eq("consulta_id", consultaId)
        .single();

      console.log("🔵 Respuesta completa de Supabase:");
      console.log("  - data:", data);
      console.log("  - error:", error);
      console.log("  - error.code:", error?.code);
      
      if (error && error.code !== 'PGRST116') {
        console.log("❌ Error detectado (no es PGRST116)");
        throw error;
      }
      
      if (error && error.code === 'PGRST116') {
        console.log("ℹ️ No se encontraron signos vitales (PGRST116)");
      }
      
      console.log("🔵 Seteando vitalSigns a:", data || null);
      setVitalSigns(data || null);
      console.log("🔵 === FIN loadVitalSigns ===");
    } catch (error) {
      console.error("❌ Exception en loadVitalSigns:", error);
    }
  };

  // Cargar receta
  const loadPrescription = async () => {
    try {
      const { data, error } = await supabase
        .from("receta")
        .select("*")
        .eq("consulta_id", consultaId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setPrescription(data || null);
      console.log("Receta cargada:", data);
    } catch (error) {
      console.error("Error al cargar receta:", error);
    }
  };

  // Cargar items de receta
  const loadPrescriptionItems = async () => {
    try {
      // Primero necesitas el ID de la receta
      const { data: recetaData, error: recetaError } = await supabase
        .from("receta")
        .select("id")
        .eq("consulta_id", consultaId)
        .single();

      if (recetaError && recetaError.code !== 'PGRST116') throw recetaError;
      
      if (recetaData) {
        const { data, error } = await supabase
          .from("item_receta")
          .select("*")
          .eq("receta_id", recetaData.id);

        if (error) throw error;
        setPrescriptionItems(data || []);
        console.log("Items de receta cargados:", data);
      }
    } catch (error) {
      console.error("Error al cargar items de receta:", error);
    }
  };

  // Cargar diagnósticos
  const loadDiagnoses = async () => {
    try {
      const { data, error } = await supabase
        .from("diagnostico")
        .select("*")
        .eq("consulta_id", consultaId);

      if (error) throw error;
      setDiagnoses(data || []);
      console.log("Diagnósticos cargados:", data);
    } catch (error) {
      console.error("Error al cargar diagnósticos:", error);
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
      
      console.log("🚀 Iniciando carga de datos para consultaId:", consultaId); // ✅ AGREGAR
      
      // Cargar todos los datos
      loadConsultation();
      loadExams();
      console.log("🔵 Antes de llamar loadVitalSigns"); // ✅ AGREGAR
      loadVitalSigns();
      console.log("🔵 Después de llamar loadVitalSigns"); // ✅ AGREGAR
      loadPrescription();
      loadPrescriptionItems();
      loadDiagnoses();
    }, [consultaId]);

    // Agregar DESPUÉS de definir todos los estados
useEffect(() => {
  console.log("📊 Estado de vitalSigns cambió:", vitalSigns);
}, [vitalSigns]);
    
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

    //EXAMENES

    const handleSaveExam = async (formData) => {
      try {
        let result;

        if (modalState?.data?.id) {
          const updatedData = {
            tipo: formData.tipo,
            indicacion: formData.indicacion,
            consulta_id: consultaData.id
          };

          result = await supabase
            .from("examen")
            .update(updatedData)
            .eq("id", modalState.data.id)
            .select("*")
            .single();

          if (result.error) throw result.error;
          Swal.fire("Actualizado", "Examen actualizado correctamente", "success");

        } else {
          const newData = {
            tipo: formData.tipo,
            indicacion: formData.indicacion,
            consulta_id: consultaData.id
          };

          result = await supabase
            .from("examen")
            .insert(newData)
            .select("*")
            .single();

          if (result.error) throw result.error;
          Swal.fire("Creado", "Examen creado correctamente", "success");
        }

        await loadExams(); 
        closeModal();

      } catch (error) {
        console.error("Error al guardar examen:", error);
        Swal.fire("Error", error.message || "No se pudo guardar el examen.", "error");
      }
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
    const handleSaveVitalSigns = async (data) => {
  try {
    console.log("💾 Iniciando guardado de signos vitales:", data); // ✅ AGREGAR
    let result;

    if (vitalSigns?.id) {
      console.log("✏️ Actualizando signos vitales existentes"); // ✅ AGREGAR
      result = await supabase
        .from("signos_vitales")
        .update(data)
        .eq("id", vitalSigns.id)
        .select("*")
        .single();
    } else {
      console.log("➕ Insertando nuevos signos vitales"); // ✅ AGREGAR
      result = await supabase
        .from("signos_vitales")
        .insert({ ...data, consulta_id: consultaId })
        .select("*")
        .single();
    }

    console.log("📥 Resultado de Supabase:", result); // ✅ AGREGAR

    if (result.error) throw result.error;

    console.log("🔄 Recargando signos vitales..."); // ✅ AGREGAR
    await loadVitalSigns();
    console.log("✅ Signos vitales recargados"); // ✅ AGREGAR
    
    closeModal();
    Swal.fire('Guardado', 'Signos vitales guardados correctamente', 'success');
  } catch (error) {
    console.error("❌ Error al guardar signos vitales:", error);
    Swal.fire("Error", error.message || "No se pudo guardar.", "error");
  }
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
    onAdd={() => openModal('vitalSigns', null)}
    onEdit={async () => {
      console.log("🔍 Buscando signos vitales para editar...");
      
      const { data, error } = await supabase
        .from("signos_vitales")
        .select("*")
        .eq("consulta_id", consultaId)
        .single();
      
      console.log("📥 Datos obtenidos:", data);
      console.log("❌ Error:", error);
      
      if (error) {
        Swal.fire('Error', 'No se encontraron signos vitales', 'error');
        return;
      }
      
      if (!data) {
        Swal.fire('Error', 'No hay datos para editar', 'error');
        return;
      }
      
      openModal('vitalSigns', data);
    }}
    onDelete={handleDeleteVitalSigns}
  />
)}
         {activeTab === 'prescription' && (
  <PrescriptionTab
    prescription={prescription}
    prescriptionItems={prescriptionItems}
    onAddPrescription={() => {
      console.log("➕ Agregando receta nueva");
      openModal('prescription', null);
    }}
    onEditPrescription={() => {
      console.log("✏️ BOTÓN EDITAR PRESIONADO");
      console.log("✏️ prescription actual:", prescription);
      console.log("✏️ consultaId:", consultaId);
      
      // Buscar directamente desde la base de datos
      (async () => {
        try {
          const { data, error } = await supabase
            .from("receta")
            .select("*")
            .eq("consulta_id", consultaId)
            .single();
          
          console.log("✏️ Datos de Supabase:", data);
          console.log("✏️ Error de Supabase:", error);
          
          if (error && error.code !== 'PGRST116') {
            console.error("✏️ Error real:", error);
            Swal.fire('Error', `Error al buscar receta: ${error.message}`, 'error');
            return;
          }
          
          if (!data) {
            console.log("✏️ No hay datos de receta");
            Swal.fire('Info', 'No hay receta registrada', 'info');
            return;
          }
          
          console.log("✏️ Abriendo modal con estos datos:", data);
          openModal('prescription', data);
        } catch (err) {
          console.error("✏️ Exception:", err);
          Swal.fire('Error', 'Error al cargar receta', 'error');
        }
      })();
    }}
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
    modalState.type === 'vitalSigns' ? (vitalSigns ? 'Editar Signos Vitales' : 'Registrar Signos Vitales') :
    modalState.type === 'prescription' ? (prescription ? 'Editar Receta' : 'Nueva Receta') :
    modalState.type === 'prescriptionItem' ? (modalState.data ? 'Editar Medicamento' : 'Nuevo Medicamento') :
    modalState.type === 'diagnosis' ? (modalState.data ? 'Editar Diagnóstico' : 'Nuevo Diagnóstico') :
    'Modal'
  }
  size={modalState.type === 'consultation' ? 'large' : 'medium'}
>
  {modalState.type === 'consultation' && (
    <MedicalConsultationForm
      key={consultaData?.id || 'new'}
      consultaData={consultaData}
      onSave={handleSaveConsultation}
      onClose={closeModal}
    />
  )}
  {modalState.type === 'exam' && (
    <ExamForm
      key={modalState.data?.id || 'new'}
      examData={modalState.data}
      onSave={handleSaveExam}
      onClose={closeModal}
    />
  )}
  {modalState.type === 'examResult' && (
    <ExamResultForm
      key={modalState.data?.id || 'new'}
      resultData={modalState.data}
      onSave={handleSaveExamResult}
      onClose={closeModal}
    />
  )}
  {modalState.type === 'vitalSigns' && (
    <VitalSignsForm
      key={vitalSigns?.id || Date.now()}
      data={vitalSigns}
      onSave={handleSaveVitalSigns}
      onClose={closeModal}
    />
  )}
  {modalState.type === 'prescription' && (
  <PrescriptionForm
    key={modalState.data?.id || Date.now()}
    data={modalState.data}  // ✅ Usar modalState.data porque ahora lo buscamos directamente
    onSave={handleSavePrescription}
    onClose={closeModal}
  />
)}
  {modalState.type === 'prescription' && (
  <PrescriptionForm
    key={prescription?.id || 'new'}
    data={prescription}  // ✅ Debe ser 'data', no 'prescriptionData'
    onSave={handleSavePrescription}
    onClose={closeModal}
  />
)}
  {modalState.type === 'diagnosis' && (
    <DiagnosisForm
      key={modalState.data?.id || 'new'}
      diagnosisData={modalState.data}
      onSave={handleSaveDiagnosis}
      onClose={closeModal}
    />
  )}
</Modal>
    </div>
  );
}; export default ConsultationMedicDetailView;
    