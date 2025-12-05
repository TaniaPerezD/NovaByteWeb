import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaSearch, 
  FaPlus,
  FaFileAlt,
  FaSortAmountDown,
  FaSortAmountUp
} from 'react-icons/fa';
import Modal from '../../components/Forms/Modal';
import ClinicalArchiveForm from '../../components/Forms/Formularios/ClinicalArchiveForm';
import MedicalConsultationForm from '../../components/Forms/Formularios/MedicalConsultationForm';
import ClinicalArchiveCard from './ClinicalArchiveCard';
import Swal from 'sweetalert2';


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
                fecha: '2024-01-20'
            },
            {
                id: 2,
                motivo: 'Control post tratamiento',
                examen_fisico: 'Presión arterial: 130/85 mmHg. Frecuencia cardíaca: 76 lpm.',
                anamnesis: 'Paciente ha seguido el tratamiento indicado.',
                plan: 'Continuar con medicación actual. Solicitar nuevo ECG en 3 meses.',
                observaciones: 'Paciente muestra buena adherencia al tratamiento.',
                fecha: '2024-02-05'
            }
            ]
        },
        {
            id: 2,
            tipo: 'Traumatología',
            descripcion: 'Lesión en rodilla derecha posterior a caída.',
            fechaCreacion: '2024-02-10',
            consultas: [
            {
                id: 3,
                motivo: 'Dolor e inflamación en rodilla derecha',
                examen_fisico: 'Edema moderado en rodilla derecha. Limitación funcional 40%.',
                anamnesis: 'Paciente sufrió caída hace 2 días mientras practicaba deporte.',
                plan: 'Radiografía de rodilla. Inmovilización con férula. AINEs por 7 días.',
                observaciones: 'Evitar apoyo completo por 10 días.',
                fecha: '2024-02-12'
            }
            ]
        }
        ]
    },
    2: {
        pacienteId: 2,
        nombre: "María González",
        files: [
        {
            id: 3,
            tipo: 'Endocrinología',
            descripcion: 'Control de diabetes mellitus tipo 2.',
            fechaCreacion: '2024-03-05',
            consultas: [
            {
                id: 4,
                motivo: 'Control de glicemia y ajuste de medicación',
                examen_fisico: 'Peso: 78kg, Talla: 1.65m, IMC: 28.6.',
                anamnesis: 'Paciente con diagnóstico de DM2 hace 3 años.',
                plan: 'Aumentar dosis de metformina. Solicitar HbA1c.',
                observaciones: 'Educar sobre control dietético.',
                fecha: '2024-03-10'
            }
            ]
        }
        ]
    }
};


const MedicalHistory = () => {
    // const [files, setFiles] = useState(mockClinicalFiles);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    const [modalState, setModalState] = useState({
        isOpen: false,
        type: null,
        data: null,
        fileId: null
    });
    const { id } = useParams();
    const navigate = useNavigate();
    const patientId = Number(id);

    const [files, setFiles] = useState([]);

    useEffect(() => {
        const patientData = mockDataByPatient[patientId];
        
        if (patientData && patientData.files) {
            setFiles(patientData.files);
        } else {
        Swal.fire({
            icon: 'error',
            title: 'Historial no encontrado',
            text: 'Este paciente no tiene historial clínico o no existe.',
            confirmButtonText: 'Volver al perfil'
        }).then(() => {
            navigate(`/paciente-perfil/${patientId}`);
        });
        }
    }, [patientId, navigate]);

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

    const handleSaveFile = (fileData) => {
        if (modalState.data) {
        setFiles(files.map(f => 
            f.id === modalState.data.id ? { ...fileData, id: f.id, consultas: f.consultas, fechaCreacion: f.fechaCreacion } : f
        ));
        } else {
        const newFile = {
            ...fileData,
            id: Math.max(...files.map(f => f.id)) + 1,
            fechaCreacion: new Date().toISOString().split('T')[0],
            consultas: []
        };
        setFiles([...files, newFile]);
        }
    };

    const handleSaveConsultation = (consultationData) => {
        const newConsultation = {
        ...consultationData,
        id: Date.now(),
        fecha: new Date().toISOString().split('T')[0]
        };

        setFiles(files.map(f => {
        if (f.id === modalState.fileId) {
            return {
            ...f,
            consultas: [...f.consultas, newConsultation]
            };
        }
        return f;
        }));
    };

    const handleDeleteFile = (id) => {
        setFiles(files.filter(f => f.id !== id));
    };

    const toggleSortOrder = () => {
        setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    };

    if (files.length === 0 && mockDataByPatient[patientId]) {
        return <div className="p-8 text-center">Cargando historial clínico...</div>;
    }

    return (
    <div className="clinical-files">
        {/* <div className="page-header">
            <h1>Archivos Clínicos</h1>
        </div> */}

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
            <button className="btn-new-file" onClick={() => openModal('file')}>
            <FaPlus /> Nuevo Archivo Clínico
            </button>
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
                    onDelete={handleDeleteFile}
                    onAddConsultation={(fileId) => openModal('consultation', null, fileId)}
                    onViewDetails={() => window.open(`/paciente-perfil/${patientId}/historial-medico/consulta/${file.id}`, '_blank')}
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
        </div>
    );
}; export default MedicalHistory;