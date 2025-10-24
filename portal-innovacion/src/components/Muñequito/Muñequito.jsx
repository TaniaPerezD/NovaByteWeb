import React, { useEffect, useRef, useState } from "react";
import munquito from "../../assets/img/iconos/mascota.png";

const Muñequito = ({ isVisible }) => {
  const [isOpen, setIsOpen] = useState(isVisible);
  const [shouldRender, setShouldRender] = useState(isVisible);
  const overlayRef = useRef(null);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleClickOutside = (e) => {
    if (overlayRef.current && !overlayRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
      const timer = setTimeout(() => setShouldRender(false), 500); // Sincronizado con duración de animación
      return () => clearTimeout(timer);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div className={`muneco-overlay ${isOpen ? "visible" : "hidden"}`}>
      <div
        className={`muneco-wrapper ${isOpen ? "visible" : "hidden"}`}
        ref={overlayRef}
      >
        <div className="muneco">
          <img src={munquito} alt="Mascota" className="muneco-image" />
        </div>
        <div className="speech-bubble">
          <button className="close-button" onClick={handleClose}>
            &times;
          </button>
          <p>
            Bienvenido a la Página de Ingeniería en Innovación Empresarial,
            descubre más de nuestra carrera aquí o en nuestras redes sociales.
          </p>
          <div className="it-footer-social">
            <a href="https://www.facebook.com">
              <i className="fa-brands fa-facebook-f"></i>
            </a>
            <a href="https://www.instagram.com">
              <i className="fa-brands fa-instagram"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Muñequito;