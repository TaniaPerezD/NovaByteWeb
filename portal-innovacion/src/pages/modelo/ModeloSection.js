import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { Sparkles, Upload, CheckCircle, FolderOpen, Rocket } from 'lucide-react';


const ModeloSection = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewURL, setPreviewURL] = useState('');
  const [result, setResult] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewURL(URL.createObjectURL(file));
      setResult(null); // Limpia resultados anteriores
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      Swal.fire({
        icon: 'warning',
        title: 'Imagen no seleccionada',
        text: 'Por favor, selecciona una imagen antes de subir.',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:7860/predict', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const prediction = await response.json();
        setResult(prediction);
        Swal.fire({
          icon: 'success',
          title: 'Análisis completado',
          text: 'Revisa los resultados detallados más abajo.',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo analizar la imagen. Intenta nuevamente.',
        });
      }
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      Swal.fire({
        icon: 'error',
        title: 'Problema de conexión',
        text: 'Ocurrió un error durante la subida.',
      });
    }
  };

  const getTopPrediction = () => {
    if (!result) return null;
    return Object.entries(result).reduce((max, curr) =>
      curr[1] > max[1] ? curr : max
    );
  };

  const topPrediction = getTopPrediction();

  return (
    <div 
      style={{ 
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 182, 205, 0.2)), url(${'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bWVkaWNhbCUyMGltYWdlc3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed', 
        minHeight: '100vh', 
        width: '100%', 
        padding: 0, 
        margin: 0, 
      }}
    >
      <div className="container py-5">
        <div className="row align-items-center gx-5">
          <div className="col-lg-6 mb-5 mb-lg-0">
            <div className="text-center">
              <img
                src={'https://images.unsplash.com/photo-1588776814546-3f3f3f3f3f3f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bWVkaWNhbCUyMGltYWdlc3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60'}
                alt="Imagen educativa"
                style={{
                  width: '100%',
                  borderRadius: '20px',
                  boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
                  backgroundColor: '#f8f9fa',
                  padding: '20px',
                }}
              />
            </div>
          </div>

          <div className="col-lg-6 d-flex justify-content-center">
            <div
              className="card p-4 border-0 shadow-lg rounded-4"
              style={{
                background: 'linear-gradient(135deg, #ffe9ef 0%, #ffc9d7 50%, #ffbccd 100%)',
                color: '#5a2a3c',
                maxWidth: '500px',
                width: '100%',
              }}
            >
              <div className="it-about-3-title-box">
                <span
                  className="d-inline-block mb-2 fw-semibold"
                  style={{
                    color: '#c2185b',
                    fontSize: '0.9rem',
                    letterSpacing: '0.5px',
                    background: 'linear-gradient(45deg, #c2185b, #e91e63)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Sparkles size={16} />
                  ANÁLISIS DE IMAGEN
                </span>

                <h2
                  className="pb-3"
                  style={{
                    fontWeight: '700',
                    color: '#a12646',
                    background: 'linear-gradient(135deg, #a12646, #c2185b)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Sube tu Mamografía 
                </h2>

                <p className="pb-3" style={{ fontSize: '1rem', color: '#5a2a3c' }}>
                  Esta herramienta usa inteligencia artificial para analizar imágenes mamográficas y predecir la posibilidad de tumor benigno o maligno, considerando la densidad del tejido.
                </p>

                <form onSubmit={handleSubmit}>
                  <div className="mb-3 text-center">
                    <label
                      htmlFor="fileUpload"
                      className="btn w-100 d-flex align-items-center justify-content-center gap-2"
                      style={{
                        backgroundColor: '#fff',
                        border: '2px dashed #fc809f',
                        borderRadius: '15px',
                        padding: '15px',
                        color: selectedFile ? '#5a2a3c' : '#a12646',
                        fontWeight: '600',
                        cursor: 'pointer',
                        background: selectedFile
                          ? 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                          : 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                        boxShadow: '0 4px 15px rgba(161, 38, 70, 0.1)',
                      }}
                    >
                      {selectedFile ? (
                        <>
                          <CheckCircle size={20} />
                          {selectedFile.name}
                        </>
                      ) : (
                        <>
                          <FolderOpen size={20} />
                          Elegir imagen de mamografía
                        </>
                      )}
                    </label>
                    <input
                      id="fileUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                  </div>

                  {previewURL && (
                    <div className="mb-3 text-center">
                      <img
                        src={previewURL}
                        alt="Vista previa"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '300px',
                          borderRadius: '15px',
                          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                          border: '3px solid rgba(255, 255, 255, 0.8)',
                        }}
                      />
                    </div>
                  )}

                  <div className="it-video-button d-flex justify-content-center align-items-center gap-4">
                    <button
                      type="submit"
                      className="ed-btn-square theme d-flex align-items-center gap-2"
                      style={{
                        border: 'none',
                        background: 'linear-gradient(135deg, #a12646 0%, #c2185b 50%, #e91e63 100%)',
                        borderRadius: '12px',
                        padding: '12px 30px',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '1rem',
                        boxShadow: '0 6px 20px rgba(161, 38, 70, 0.3)',
                      }}
                    >
                      <Rocket size={18} />
                      <span>Subir Imagen</span>
                    </button>
                  </div>
                </form>

                {result && (
                  <div className="mt-4 p-3 rounded shadow" style={{ backgroundColor: '#fff3f6' }}>
                    <h5 className="mb-3" style={{ color: '#a12646' }}>Resultado del análisis:</h5>
                    <ul className="list-unstyled">
                      {Object.entries(result).sort((a, b) => b[1] - a[1]).map(([label, value]) => (
                        <li key={label} style={{ padding: '4px 0', fontWeight: '500', color: label === topPrediction[0] ? '#c2185b' : '#5a2a3c' }}>
                          {label}: <strong>{(value * 100).toFixed(2)}%</strong> {label === topPrediction[0] && '⬅️ más probable'}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3" style={{ fontSize: '0.95rem', color: '#5a2a3c' }}>
                      Este modelo estima la probabilidad de que una mamografía tenga características benignas o malignas, según la densidad del tejido. Recuerda que este resultado no reemplaza un diagnóstico médico profesional.
                    </p>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeloSection;
