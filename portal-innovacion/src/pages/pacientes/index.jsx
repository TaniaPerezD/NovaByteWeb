import React, { useState, useMemo } from 'react';
import { FaSearch, FaPlus } from 'react-icons/fa';
import Swal from 'sweetalert2';
import Modal from '../../components/Forms/Modal';
import PatientForm from '../../components/Forms/Formularios/PatientForm';
import Pagination from './Pagination';
import PatientTable from './PatientTable';

const mockPatients = [
  {
    id: 1,
    nombre: 'Juan',
    apellidos: 'Pérez García',
    email: 'juan.perez@email.com',
    fechaNacimiento: '1990-05-15',
    telefono: '+591 70123456',
    direccion: 'Av. 6 de Agosto #123'
  },
  {
    id: 2,
    nombre: 'María',
    apellidos: 'López Martínez',
    email: 'maria.lopez@email.com',
    fechaNacimiento: '1985-08-22',
    telefono: '+591 71234567',
    direccion: 'Calle Comercio #456'
  },
  {
    id: 3,
    nombre: 'Carlos',
    apellidos: 'Rodríguez Silva',
    email: 'carlos.rodriguez@email.com',
    fechaNacimiento: '1992-03-10',
    telefono: '+591 72345678',
    direccion: 'Zona Sur #789'
  },
  {
    id: 4,
    nombre: 'Ana',
    apellidos: 'González Torres',
    email: 'ana.gonzalez@email.com',
    fechaNacimiento: '1988-11-30',
    telefono: '+591 73456789',
    direccion: 'Av. Arce #321'
  },
  {
    id: 5,
    nombre: 'Pedro',
    apellidos: 'Sánchez Flores',
    email: 'pedro.sanchez@email.com',
    fechaNacimiento: '1995-07-18',
    telefono: '+591 74567890',
    direccion: 'Calle Murillo #654'
  },
  {
    id: 6,
    nombre: 'Laura',
    apellidos: 'Ramírez Vargas',
    email: 'laura.ramirez@email.com',
    fechaNacimiento: '1991-02-25',
    telefono: '+591 75678901',
    direccion: 'Zona Norte #987'
  },
  {
    id: 7,
    nombre: 'Diego',
    apellidos: 'Morales Castro',
    email: 'diego.morales@email.com',
    fechaNacimiento: '1987-09-14',
    telefono: '+591 76789012',
    direccion: 'Av. del Libertador #234'
  },
  {
    id: 8,
    nombre: 'Sofía',
    apellidos: 'Jiménez Ruiz',
    email: 'sofia.jimenez@email.com',
    fechaNacimiento: '1993-12-05',
    telefono: '+591 77890123',
    direccion: 'Calle Bolívar #567'
  }
];


const PatientManagement = () => {
  const [patients, setPatients] = useState(mockPatients);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const itemsPerPage = 5; // CAMBIAR SI QUUIEREN MAS NUMEROS POR HOJA

  const filteredPatients = useMemo(() => {
    return patients.filter(patient =>
      patient.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const currentPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleView = (id) => {
    window.open(`/paciente-perfil/${id}/informacion-general`, '_blank');
  };

  const handleEdit = (patient) => {
    setEditingPatient(patient);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esta acción",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E79796',
      cancelButtonColor: '#E25B5B',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        setPatients(patients.filter(p => p.id !== id));
        Swal.fire('Eliminado', 'El paciente ha sido eliminado.', 'success');
      }
    });
  };

  const handleCreateNew = () => {
    setEditingPatient(null);
    setIsModalOpen(true);
  };

  const handleFormSuccess = (formData) => {
    if (editingPatient) {
      setPatients(patients.map(p => 
        p.id === editingPatient.id ? { ...formData, id: editingPatient.id } : p
      ));
    } else {
      const newPatient = {
        ...formData,
        id: Math.max(...patients.map(p => p.id)) + 1
      };
      setPatients([...patients, newPatient]);
    }
  };

  return (
    <div className="patient-management">
      {/* <div className="header">
        <h1>Gestión de Pacientes</h1>
      </div> */}

      <div className="controls">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre, apellidos o email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <button className="button-with-arrow" onClick={handleCreateNew}>
          <FaPlus />
          Nuevo Paciente
        </button>
      </div>

      <PatientTable
        patients={currentPatients}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPatient ? 'Editar Paciente' : 'Nuevo Paciente'}
      >
        <PatientForm
          initialFormData={editingPatient}
          onSuccess={handleFormSuccess}
          onClose={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}; export default PatientManagement;