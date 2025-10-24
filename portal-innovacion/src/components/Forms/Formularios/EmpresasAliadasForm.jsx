import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { actualizarEmpresa} from '../../../redux/empresas/thunk';
import { createEmpresa } from '../../../redux/empresas/thunk';
import { useNavigate } from 'react-router';

const EmpresasAliadasForm = ({ onSuccess, initialFormData }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData || {
    name: '',
    email: '',
    description: '',
    link: '',
    state: false,
    imagen: null,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleToggleChange = () => {
    setFormData({ ...formData, state: !formData.state });
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData({ ...formData, imagen: file });
    }
  };

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validateLink = async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (event) => {
    console.log("Envio de formulario")
    event.preventDefault();

    const { name, email, description, link, state } = formData;

    if (!name || !email || !description || !link) {
      Swal.fire('Error', 'Todos los campos son obligatorios.', 'error');
      return;
    }

    if (!validateEmail(email)) {
      Swal.fire('Error', 'El email no es válido.', 'error');
      return;
    }

    const linkIsValid = await validateLink(link);
    if (linkIsValid) {
      Swal.fire('Error', 'El enlace proporcionado no es válido.', 'error');
      return;
    }

    const empresa = {
      _id: formData._id,
      name: name,
      email,
      description: description,
      link,
      state: state
    };
    
    try {
      if (initialFormData) {
        // Actualización
        await actualizarEmpresa(empresa); 
        
        Swal.fire('Éxito', 'Empresa actualizada correctamente.', 'success');
      } else {
        // Creación
        await createEmpresa(empresa);
        
        Swal.fire('Éxito', 'Empresa registrada correctamente.', 'success');
    }
    window.location.reload(true)
    onSuccess();
  } catch (error) {
    Swal.fire('Error', 'Ocurrió un problema al guardar los datos.', 'error');
  }
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
        Descripción
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
        />
      </label>
      <label>
        Link
        <input
          type="url"
          name="link"
          value={formData.link}
          onChange={handleInputChange}
          required
        />
      </label>
      <div className="checkbox-group">
        state
        <label className="checkbox-row">
          <input
            type="checkbox"
            id="state-toggle"
            checked={formData.state}
            onChange={handleToggleChange}
            className="checkbox-input"
          />
          <label htmlFor="state-toggle" className="checkbox-label">
            {formData.state ? 'Activo' : 'Inactivo'}
          </label>
        </label>
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
          {formData.imagen && (
            <div className="image-preview">
              <img
                src={URL.createObjectURL(formData.imagen)}
                alt="Preview"
                style={{ maxWidth: '100px', maxHeight: '100px' }}
              />
            </div>
          )}
      </label>
      <button type="submit">Registrar Empresa Aliada</button>
    </form>
  );
}; export default EmpresasAliadasForm;