import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { createSociedad } from '../../../redux/sociedad/thunk';
import { useNavigate } from 'react-router';

const SociedadForm = ({ onSuccess, initialFormData }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData ||{
    name: '',
    objetive: '',
    image: null,
    isDeleted: false,
    start: '',
    end: '',
    socialLinks: [''],
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleLinkChange = (index, value) => {
    const updatedLinks = [...formData.socialLinks];
    updatedLinks[index] = value;
    setFormData({ ...formData, socialLinks: updatedLinks });
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
    }
  };

  const addLinkField = () => {
    setFormData({ ...formData, socialLinks: [...formData.socialLinks, ''] });
  };

  const removeLinkField = (index) => {
    const updatedLinks = formData.socialLinks.filter((_, i) => i !== index);
    setFormData({ ...formData, socialLinks: updatedLinks });
  };

  const validateDates = () => {
    if (new Date(formData.end) <= new Date(formData.start)) {
      return 'La fecha de fin debe ser posterior a la fecha de inicio.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    console.log("Envio de formulario")
    e.preventDefault();

    const { name, objetive, start, end, socialLinks } = formData;

    if (!name || !objetive || !start || !end || !socialLinks.length || !socialLinks[0]) {
      Swal.fire('Error', 'Todos los campos obligatorios deben ser completados.', 'error');
      return;
    }

    const dateError = validateDates();
    if (dateError) {
      Swal.fire('Error', dateError, 'error');
      return;
    }

    Swal.fire('Éxito', 'Centro registrado correctamente.', 'success');

    const empresa = {
      name,
      objetive,
      isDeleted: formData.isDeleted,
      start,
      end,
      socialLinks
    }

    createSociedad(empresa)
    navigate("/sce")
    onSuccess();
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        Nombre
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
      </label>

      <label>
        Objetivo
        <textarea
          name="objetive"
          value={formData.objetive}
          onChange={handleInputChange}
          required
        ></textarea>
      </label>

      <label>
        Fecha de Inicio
        <input
          type="date"
          name="start"
          value={formData.start}
          onChange={handleInputChange}
          required
        />
      </label>

      <label>
        Fecha de Fin
        <input
          type="date"
          name="end"
          value={formData.end}
          onChange={handleInputChange}
          required
        />
      </label>

      <div className="links-section">
        <label>Redes Sociales</label>
        {formData.socialLinks.map((link, index) => (
          <div key={index} className="link-input-group">
            <input
              type="url"
              value={link}
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

      <label className="image-upload">
        <span className="custom-button">Subir Imagen</span>
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleImageChange}
        />
      </label>

      {formData.image && (
        <div className="image-preview">
          <img
            src={URL.createObjectURL(formData.image)}
            alt="Preview"
            style={{ maxWidth: '100px', maxHeight: '100px' }}
          />
        </div>
      )}

      <button type="submit">Registrar Sociedad</button>
    </form>
  );
}; export default SociedadForm;
