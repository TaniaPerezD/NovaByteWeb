import React, { useState, useEffect, useMemo } from 'react';
import { FaSearch, FaPlus } from 'react-icons/fa';
import {supabase} from "../../services/supabaseClient";
import Swal from 'sweetalert2';
import Modal from '../../components/Forms/Modal';
import PatientForm from '../../components/Forms/Formularios/PatientForm';
import Pagination from './Pagination';
import PatientTable from './PatientTable';
import { v4 as uuidv4 } from 'uuid';

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

  const loadPatients = async () => {
    const { data, error } = await supabase
      .from("perfil")
      .select("*")
      .eq("rol", "paciente");
  
    if (!error) {
      setPatients(data);
    }
  };
  
  useEffect(() => {
    loadPatients();
  }, []); 

  
  const filteredPatients = useMemo(() => {
    const term = searchTerm.toLowerCase();
  
    return patients.filter((patient) => {
      const nombre = patient?.nombre?.toLowerCase() || "";
      const apellidos = patient?.apellidos?.toLowerCase() || "";
      const email = patient?.email?.toLowerCase() || "";
  
      return (
        nombre.includes(term) ||
        apellidos.includes(term) ||
        email.includes(term)
      );
    });
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
  const handleFormSuccess = async (formData) => {
    try {
      let result;
  
      if (editingPatient) {
        // UPDATE perfil existente
        const updatedData = {
          nombre: formData.nombre,
          apellidos: formData.apellidos,
          email: formData.email,
          telefono: formData.telefono,
          direccion: formData.direccion,
          fecha_nacimiento: formData.fechaNacimiento,
          rol: "paciente"
        };
  
        result = await supabase
          .from("perfil")
          .update(updatedData)
          .eq("id", editingPatient.id)
          .select("*")
          .single();
  
        if (result.error) throw result.error;
  
        Swal.fire("Actualizado", "Paciente actualizado con éxito", "success");
  
      } else {
        const { data, error } = await supabase.functions.invoke(
          "crear-usuario",
          {
            body: { email: formData.email }
          }
        );
      
        if (error) {
          console.error("Error al crear usuario:", error);
          throw new Error("Error al crear usuario");
        }
    
        const newUserId = data.userId;
  
        // CREAR PERFIL usando el ID del usuario que acaba de ser creado
        const profileData = {
          id: newUserId,
          nombre: formData.nombre,
          apellidos: formData.apellidos,
          email: formData.email,
          telefono: formData.telefono,
          direccion: formData.direccion,
          fecha_nacimiento: formData.fechaNacimiento,
          rol: "paciente"
        };
  
        const { data: insertData, error: profileError } = await supabase
          .from("perfil")
          .insert(profileData)
          .select("*")
          .single();
  
        if (profileError) throw profileError;
  
        Swal.fire("Creado", "Paciente agregado con éxito", "success");
      }
  
      await loadPatients();
      setIsModalOpen(false);
  
    } catch (error) {
      console.error("Error al guardar paciente:", error);
      Swal.fire("Error", error.message || String(error), "error");
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