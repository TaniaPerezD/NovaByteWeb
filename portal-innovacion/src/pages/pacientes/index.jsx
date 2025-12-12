import React, { useState, useEffect, useMemo } from 'react';
import { FaSearch, FaPlus } from 'react-icons/fa';
import { supabase } from "../../services/supabaseClient";
import Swal from 'sweetalert2';
import Modal from '../../components/Forms/Modal';
import PatientForm from '../../components/Forms/Formularios/PatientForm';
import Pagination from './Pagination';
import PatientTable from './PatientTable';

// Importar signUpPaciente desde authService
import { signUpPaciente } from "../../services/authService";

const PatientManagement = () => {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);

  const itemsPerPage = 5;

  // -----------------------------
  // Cargar pacientes de Supabase
  // -----------------------------
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

  // -----------------------------
  // Filtro de búsqueda
  // -----------------------------
  const filteredPatients = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return patients.filter((p) => {
      const nombre = p?.nombre?.toLowerCase() || "";
      const apellidos = p?.apellidos?.toLowerCase() || "";
      const email = p?.email?.toLowerCase() || "";

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

  // -----------------------------
  // Ver perfil de paciente
  // -----------------------------
  const handleView = (id) => {
    window.open(`/paciente-perfil/${id}/informacion-general`, "_blank");
  };

  // -----------------------------
  // Editar paciente
  // -----------------------------
  const handleEdit = (patient) => {
    setEditingPatient(patient);
    setIsModalOpen(true);
  };

  // -----------------------------
  // Desactivar paciente
  // -----------------------------
  const handleDelete = async (id) => {
    Swal.fire({
      title: "¿Desactivar paciente?",
      text: "El paciente no será eliminado, solo desactivado.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#E79796",
      cancelButtonColor: "#E25B5B",
      confirmButtonText: "Sí, desactivar",
    }).then(async (r) => {
      if (r.isConfirmed) {
        const { error } = await supabase
          .from("perfil")
          .update({ activo: false })
          .eq("id", id);

        if (error) {
          Swal.fire("Error", "No se pudo desactivar el paciente", "error");
          return;
        }

        await loadPatients();

        Swal.fire("Desactivado", "Paciente marcado como inactivo.", "success");
      }
    });
  };

  // -----------------------------
  // Crear paciente nuevo
  // -----------------------------
  const handleCreateNew = () => {
    setEditingPatient(null);
    setIsModalOpen(true);
  };

  // -----------------------------
  // Guardar paciente (crear o editar)
  // -----------------------------
  const handleFormSuccess = async (formData) => {
  try {
    // ----------------------------
    // EDITAR PACIENTE
    // ----------------------------
    if (editingPatient) {
      const updateData = {
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        email: formData.email,
        telefono: formData.telefono,
        direccion: formData.direccion,
        fecha_nacimiento: formData.fechaNacimiento,
      };

      const { error } = await supabase
        .from("perfil")
        .update(updateData)
        .eq("id", editingPatient.id);

      if (error) throw error;

      Swal.fire("Actualizado", "Paciente actualizado correctamente", "success");
    }

    // ----------------------------
    // NUEVO PACIENTE
    // ----------------------------
    else {
      // Igual que en SignUpMain: solo llamamos a signUpPaciente
      await signUpPaciente({
        nombre: formData.nombre.trim(),
        apellidos: formData.apellidos.trim(),
        email: formData.email.trim(),
        fecha_nacimiento: formData.fechaNacimiento, // viene en formato yyyy-mm-dd desde el input type="date"
      });

      Swal.fire({
        icon: "success",
        title: "Paciente registrado",
        text: `Se envió el enlace al correo del paciente (${formData.email.trim()}).`,
        confirmButtonColor: "#E79796",
      });
    }

    await loadPatients();
    setIsModalOpen(false);

  } catch (err) {
    Swal.fire("Error", err.message, "error");
  }
};
  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="patient-management">

      <div className="controls">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <button className="button-with-arrow" onClick={handleCreateNew}>
          <FaPlus /> Nuevo Paciente
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
        title={editingPatient ? "Editar Paciente" : "Nuevo Paciente"}
      >
        <PatientForm
          initialFormData={editingPatient}
          onSuccess={handleFormSuccess}
          onClose={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default PatientManagement;