import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { createUsociedad } from '../../../redux/usociedad/thunk';
import { useNavigate } from 'react-router';

const SociedadUsuariosForm = ({ onSuccess, initialFormData }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData ||{
    name: '',
    email: '',
    password: '',
    rol: '',
    isDeleted: false,
    isCentro: false,
    isSociedad: false,
    isDocente: false,
    isGraduado: false,
    photo: null,
    socialLinks: [''],
    role: '',
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData({ ...formData, photo: file });
    }
  };

  const handleLinkChange = (index, value) => {
    const updatedLinks = [...formData.socialLinks];
    updatedLinks[index] = value;
    setFormData({ ...formData, socialLinks: updatedLinks });
  };

  const addLinkField = () => {
    setFormData({ ...formData, socialLinks: [...formData.socialLinks, ''] });
  };

  const removeLinkField = (index) => {
    const updatedLinks = formData.socialLinks.filter((_, i) => i !== index);
    setFormData({ ...formData, socialLinks: updatedLinks });
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateLinks = async (links) => {
    const validationPromises = links.map(async (link) => {
      try {
        await fetch(link, { method: 'HEAD', mode: 'no-cors' });
        return true;
      } catch (error) {
        console.error(`Error validating link ${link}:`, error);
        return false;
      }
    });
    const results = await Promise.all(validationPromises);
    return results.every(result => result);
  };

  const validateRoleLogic = () => {
    const { rol, isDocente, isCentro, isSociedad } = formData;

    if (rol === 'estudiante' && isDocente) {
      return 'Un estudiante no puede estar marcado como docente.';
    }

    if (rol === 'docente' && (isCentro || isSociedad)) {
      return 'Un docente no puede ser parte del centro o de la sociedad científica.';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    console.log("Envio de formulario")
    e.preventDefault();

    const { name, email, password, rol, socialLinks } = formData;

    if (!name || !email || !password || !rol || !socialLinks.length || !socialLinks[0]) {
      Swal.fire('Error', 'Todos los campos son obligatorios.', 'error');
      return;
    }

    if (!validateEmail(email)) {
      Swal.fire('Error', 'El email no es válido.', 'error');
      return;
    }

    const socialLinksValid = await validateLinks(socialLinks);
    if (!socialLinksValid) {
      Swal.fire('Error', 'Uno o más enlaces de redes sociales no son válidos.', 'error');
      return;
    }

    const roleError = validateRoleLogic();
    if (roleError) {
      Swal.fire('Error', roleError, 'error');
      return;
    }

    Swal.fire('Éxito', 'Docente registrado correctamente.', 'success');
    // enviar los datos al servidor. devolver todo a los datos normales
    const empresa = {
      name,
      email,
      password,
      rol,
      role: formData.role,
      socialLinks,
      designation: formData.designation,
      state: formData.state,
    }
    
    createUsociedad(empresa)
    navigate("/sce")
    onSuccess();
    onSuccess();
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        name
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
      </label>

      <label>
        Email
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
        />
      </label>

      <label>
        Contraseña
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          required
        />
      </label>

      <label className="select-container">
        Rol
        <select
          name="rol"
          value={formData.rol}
          onChange={handleInputChange}
          required
          className="select"
        >
          <option value="">Seleccionar</option>
          <option value="estudiante">Estudiante</option>
          <option value="docente">Docente</option>
          <option value="admin">Admin</option>
        </select>
      </label>

      <div className="checkbox-group">
            {[
                { name: "isCentro", label: "Es Parte del Centro" },
                { name: "isSociedad", label: "Es Parte de la Sociedad Científica" },
                { name: "isDocente", label: "Es Docente" },
                { name: "isGraduado", label: "Está Graduado" },
            ].map(({ name, label }) => (
                <label key={name} className="checkbox-row">
                    <input
                        type="checkbox"
                        name={name}
                        checked={formData[name]}
                        onChange={handleInputChange}
                        className="checkbox-input"
                    />
                    <span className="checkbox-label">{label}</span>
                </label>
            ))}
      </div>

      <div className="links-section">
        <label>Links</label>
        {formData.socialLinks.map((socialLinks, index) => (
          <div key={index} className="link-input-group">
            <input
              type="url"
              value={socialLinks}
              onChange={(e) => handleLinkChange(index, e.target.value)}
              placeholder="Introduce un enlace"
              required
            />
            <button
              type="button"
              onClick={() => removeLinkField(index)}
              className="btn-remove-link"
            >
              Quitar
            </button>
          </div>
        ))}
        <button type="button" onClick={addLinkField} className="btn-add-link">
          Añadir Link
        </button>
      </div>
      <label>
        <label className="image-upload">
          <span className="custom-button">Subir Imágen</span>
          <input
            type="file"
            name="image"
            multiple
            accept="image/*"
            onChange={handleImageChange}
          />
          <span className="text">Puedes subir hasta 1 imágen.</span>
        </label>
          {formData.photo && (
            <div className="image-preview">
              <img
                src={URL.createObjectURL(formData.photo)}
                alt="Preview"
                style={{ maxWidth: '100px', maxHeight: '100px' }}
              />
            </div>
          )}
      </label>
      <label className="select-container">
        Rol
        <select
          name="role"
          value={formData.role}
          onChange={handleInputChange}
          required
          className="select"
        >
          <option value="">Seleccionar</option>
          <option value="Presidente">Presidente</option>
          <option value="Vice-Presidente">Vice-Presidente</option>
          <option value="Miembro">Miembro</option>
        </select>
      </label>
      <button type="submit">Registrar Miembro de la Sociedad</button>
    </form>
  );
}; export default SociedadUsuariosForm;