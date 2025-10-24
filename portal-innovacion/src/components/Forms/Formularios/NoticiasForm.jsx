import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Swal from 'sweetalert2';
import { createNews } from '../../../redux/noticias/thunk';
import { useNavigate } from 'react-router';

const NoticiasFormComponent = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setdescription] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [tags, setTags] = useState(''); 

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length + imageFiles.length > 3) {
      Swal.fire('Error', 'Solo puedes subir hasta 3 imágenes.', 'error');
      return;
    }
    setImageFiles((prevFiles) => [...prevFiles, ...files]);
  };

  const handleImageRemove = (index) => {
    setImageFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = (event) => {
    console.log("Envio de formulario")
    event.preventDefault();

    if (!title.trim()) {
      Swal.fire('Error', 'Debes ingresar un título.', 'error');
      return;
    }
    if (!description.trim()) {
      Swal.fire('Error', 'Debes escribir el contenido de la noticia.', 'error');
      return;
    }
    if (!tags.trim()) {
      Swal.fire('Error', 'Debes ingresar al menos una etiqueta.', 'error');
      return;
    }
    const currentDate = new Date().toISOString();

    // enviar datos
    

    const noticia = {
      title,
      description,
      start: currentDate,
      // start: FormData.start,
      tags: tags.split(','),

    }
    
    createNews(noticia);

  // Mostrar mensaje de éxito
  Swal.fire('Éxito', 'La noticia ha sido publicada.', 'success');

  // Limpiar los estados después de la publicación
  setTitle('');
  setdescription('');
  setTags('');
  setImageFiles([]);
  onSuccess();

  // Navegar a otra página (si es necesario)
  navigate("/News");
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        Título
        <input
          type="text"
          name="titulo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>
      <label>
        Escribe el contenido de la noticia aquí
        <ReactQuill
          value={description}
          onChange={setdescription}
          placeholder="Escribe la noticia aquí"
          modules={{
            toolbar: [
              [{ size: [] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['link'],
              ['align'],
              ['blockquote', 'code-block'],
            ],
          }}
        />
      </label>
      <label>
        Tags/Etiquetas
        <input
          type="text"
          name="tags"
          placeholder="Separados por comas"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </label>
      <label className="image-upload">
        <span className="custom-button">Subir Imágenes</span>
        <input
          type="file"
          name="image"
          multiple
          accept="image/*"
          onChange={handleImageChange}
        />
        <span className="text">Puedes subir hasta 3 imágenes.</span>
      </label>
      <div className="image-preview">
        {imageFiles.map((file, index) => (
          <div key={index} className="image-item">
            <img src={URL.createObjectURL(file)} alt={`preview ${index + 1}`} />
            <button type="button" onClick={() => handleImageRemove(index)}>
              Eliminar
            </button>
          </div>
        ))}
      </div>
      <button type="submit">Publicar Nueva Noticia</button>
    </form>
  );
}; export default NoticiasFormComponent;