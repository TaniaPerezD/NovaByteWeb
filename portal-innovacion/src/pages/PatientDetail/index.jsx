import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {supabase} from "../../services/supabaseClient";
import Modal from '../../components/Forms/Modal';
import PatientForm from '../../components/Forms/Formularios/PatientForm';
import AllergyForm from '../../components/Forms/Formularios/AllergyForm';
import BackgroundForm from '../../components/Forms/Formularios/BackgroundForm.jsx';
import PatientInfo from './PatientInfo';
import AllergiesSection from './AllergiesSection';
import BackgroundsSection from './BackgroundsSection';

const mockPatients = [
  {
    id: 1,
    nombre: 'Juan Carlos',
    apellidos: 'Pérez García',
    email: 'juan.perez@email.com',
    fechaNacimiento: '1990-05-15',
    alergias: [
      { id: 1, sustancia: 'Penicilina', severidad: 'alta', observacion: 'Reacción anafiláctica en 2018. Evitar todos los antibióticos betalactámicos.' },
      { id: 2, sustancia: 'Polen', severidad: 'media', observacion: 'Rinitis alérgica estacional. Síntomas controlados con antihistamínicos.' },
      { id: 3, sustancia: 'Mariscos', severidad: 'baja', observacion: 'Urticaria leve al consumir camarones.' }
    ],
    antecedentes: [
      { id: 1, tipo: 'Quirúrgico', descripcion: 'Apendicectomía en 2015. Sin complicaciones.' },
      { id: 2, tipo: 'Familiar', descripcion: 'Padre con diabetes tipo 2. Madre con hipertensión.' },
      { id: 3, tipo: 'Patológico', descripcion: 'Asma bronquial controlada desde la infancia.' }
    ]
  },
  {
    id: 2,
    nombre: 'María',
    apellidos: 'López Martínez',
    email: 'maria.lopez@email.com',
    fechaNacimiento: '1985-08-22',
    alergias: [
      { id: 1, sustancia: 'Penicilina', severidad: 'alta', observacion: 'Reacción anafiláctica en 2018. Evitar todos los antibióticos betalactámicos.' },
      { id: 2, sustancia: 'Polen', severidad: 'media', observacion: 'Rinitis alérgica estacional. Síntomas controlados con antihistamínicos.' },
      { id: 3, sustancia: 'Mariscos', severidad: 'baja', observacion: 'Urticaria leve al consumir camarones.' }
    ],
    antecedentes: [
      { id: 1, tipo: 'Quirúrgico', descripcion: 'Apendicectomía en 2015. Sin complicaciones.' },
      { id: 2, tipo: 'Familiar', descripcion: 'Padre con diabetes tipo 2. Madre con hipertensión.' },
      { id: 3, tipo: 'Patológico', descripcion: 'Asma bronquial controlada desde la infancia.' }
    ]
  },
];



const PatientDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patientData, setPatientData] = useState(null);
  
  const [alergiaData, setAlergiaData] = useState([]);

  // Cargar un solo paciente por ID
  const loadPatient = async () => {
    const { data, error } = await supabase
      .from("perfil")
      .select("*")
      .eq("id", id)        // aquí usamos el ID dinámico del URL
      .single();           // devuelve solo 1 registro

    if (error || !data) {
      Swal.fire({
        icon: 'error',
        title: 'Paciente no encontrado',
        text: 'El paciente con este ID no existe.',
        confirmButtonText: 'Volver a la lista'
      }).then(() => {
        navigate('/pacientes');
      });
    } else {
      setPatientData(data);
      console.log("Paci ente cargado:", data);
    }
  };

  const loadAlergia = async () => {
    const { data, error } = await supabase
      .from("alergia")
      .select("*")
      .eq("paciente_id", id)        // aquí usamos el ID dinámico del URL
    console.log("Alergia data fetch:", data);
    console.log("Alergia error fetch:", error);
    if (error || !data) {
      Swal.fire({
        icon: 'error',
        title: 'No tiene alegias',
        text: 'El paciente con este ID no tiene alergias.',
      });
    } else {
      setAlergiaData(data);
      console.log("Alergia ente cargado:", data);
    }
  };
  
  // Ejecutar solo cuando cambie el ID
  useEffect(() => {
    if (id) {
      loadPatient();
      loadAlergia();
    }
  }, [id]);

  useEffect(() => {
    const patient = loadPatient();
    if (patient) {
      setPatientData(patient);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Paciente no encontrado',
        text: 'El paciente con este ID no existe.',
        confirmButtonText: 'Volver a la lista'
      }).then(() => {
        navigate('/pacientes');
      });
    }
  }, [id, navigate]);
  
  
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    data: null
  });

  const openModal = (type, data = null) => {
    setModalState({ isOpen: true, type, data });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, data: null });
  };

  const handleSavePatientInfo = async (formData) => {
    try {
      const updatedData = {
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        email: formData.email,
        telefono: formData.telefono,
        direccion: formData.direccion,
        fecha_nacimiento: formData.fechaNacimiento,
        rol: "paciente"
      };
  
      const { data, error } = await supabase
        .from("perfil")
        .update(updatedData)
        .eq("id", id)
        .select("*")
        .single();
  
      if (error) throw error;
  
      setPatientData(data);
  
      Swal.fire("Actualizado", "Información del paciente actualizada con éxito", "success");
      closeModal();
  
    } catch (error) {
      console.error("Error al actualizar paciente:", error);
      Swal.fire("Error", error.message || "No se pudo actualizar la información.", "error");
    }
  };
  const handleSaveAllergy = async (formData) => {
    try {
      let result;
  
      if (formData.id) {
        // ⭐ UPDATE alergia existente
        const updatedData = {
          sustancia: formData.sustancia,
          severidad: formData.severidad,
          observacion: formData.observacion
        };
  
        result = await supabase
          .from("alergia")
          .update(updatedData)
          .eq("id", formData.id)
          .select("*")
          .single();
  
        if (result.error) throw result.error;
  
        Swal.fire("Actualizado", "Alergia actualizada con éxito", "success");
  
      } else {
        const newData = {
          paciente_id: id, // este sí es necesario al insertar
          sustancia: formData.sustancia,
          severidad: formData.severidad,
          observacion: formData.observacion
        };
  
        result = await supabase
          .from("alergia")
          .insert(newData)
          .select("*")
          .single();
  
        if (result.error) throw result.error;
  
        Swal.fire("Creado", "Alergia creada con éxito", "success");
      }
  
      await loadAlergia(); // refresca tu tabla/lista
      closeModal();
  
    } catch (error) {
      console.error("Error al guardar alergia:", error);
      Swal.fire("Error", error.message || "No se pudo guardar la alergia.", "error");
    }
  };

  const handleSaveBackground = (backgroundData) => {
    if (modalState.data) {
      setPatientData({
        ...patientData,
        antecedentes: patientData.antecedentes.map(a => 
          a.id === modalState.data.id ? { ...backgroundData, id: a.id } : a
        )
      });
    } else {
      const newBackground = { ...backgroundData, id: Date.now() };
      setPatientData({
        ...patientData,
        antecedentes: [...patientData.antecedentes, newBackground]
      });
    }
  };

  const handleDeleteAllergy = (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta alergia será eliminada permanentemente",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E79796',
      cancelButtonColor: '#E25B5B',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        setPatientData({
          ...patientData,
          alergias: patientData.alergias.filter(a => a.id !== id)
        });
        Swal.fire('Eliminado', 'La alergia ha sido eliminada.', 'success');
      }
    });
  };

  const handleDeleteBackground = (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Este antecedente será eliminado permanentemente",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E79796',
      cancelButtonColor: '#E25B5B',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        setPatientData({
          ...patientData,
          antecedentes: patientData.antecedentes.filter(a => a.id !== id)
        });
        Swal.fire('Eliminado', 'El antecedente ha sido eliminado.', 'success');
      }
    });
  };

  if (!patientData) {
    return <div className="empty-state">Cargando paciente...</div>;
  }

  return (
    <div className="patient-detail-view">
      {/* <div className="page-header">
        <h1>Historial Médico</h1>
      </div> */}

      <PatientInfo 
        patient={patientData} 
        onEdit={() => openModal('patientInfo', patientData)}
      />
      <AllergiesSection
        alergias={alergiaData}
        onEdit={(alergia) => openModal('allergy', alergia)}
        onAdd={() => openModal('allergy')}
        onDelete={handleDeleteAllergy}
      />

      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={
          modalState.type === 'patientInfo' ? 'Editar Información del Paciente' :
          modalState.type === 'allergy' ? (modalState.data ? 'Editar Alergia' : 'Nueva Alergia') :
          modalState.type === 'background' ? (modalState.data ? 'Editar Antecedente' : 'Nuevo Antecedente') :
          ''
        }
      >
        {modalState.type === 'patientInfo' && modalState.data && (
          <PatientForm
            patientData={patientData}   //  Info del paciente cargada
            onSuccess={handleSavePatientInfo}  // Guarda en Supabase y refresca
            onClose={closeModal}
          />
        )}
        {modalState.type === 'allergy' && (
          <AllergyForm
            allergyData={alergiaData.find(a => a.id === (modalState.data ? modalState.data.id : null)) || null}
            onSave={handleSaveAllergy}
            onClose={closeModal}
          />
        )}
        {modalState.type === 'background' && (
          <BackgroundForm
            backgroundData={modalState.data}
            onSave={handleSaveBackground}
            onClose={closeModal}
          />
        )}
      </Modal>
    </div>
  );
}; export default PatientDetailView;