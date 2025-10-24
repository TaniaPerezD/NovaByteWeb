import { useCallback, useEffect, useRef, useState } from 'react';

function useOutsideClick(ref, callback, setFlipped) {
    const handleOutsideClick = useCallback(
        (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                callback();
                setFlipped(false);  // Restablecer el estado de flipped a false
            }
        },
        [callback, ref, setFlipped]
    );

    useEffect(() => {
        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [handleOutsideClick]);
}

function Tarjeta({ selectedMateria, onClose }) {
    const modalRef = useRef(null);
    const [flipped, setFlipped] = useState(false);

    useOutsideClick(modalRef, onClose, setFlipped);  // Pasa setFlipped a useOutsideClick

    if (!selectedMateria || typeof selectedMateria !== 'object') return null;
    const {
        nombre,
        sigla,
        costo,
        prerequisitos,
        video = "https://www.youtube.com/embed/8HezuCQixps?si=QWZrLAFebdh4Vt-5", // URL por defecto
        resumen,
        competenciasAsignatura,
        competenciasGenericas
    } = selectedMateria;

    const loremText =  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

    const resumenText = resumen || loremText;
    const competenciasAsignaturaText = competenciasAsignatura || loremText;
    const competenciasGenericasText = competenciasGenericas || loremText;

    return (
        <div className="modal">
            <div className={`card-container ${flipped ? 'flipped' : ''}`} ref={modalRef}>
                <div className="card-front">
                    
                    <h3 className="third-tittle-modal">{costo}</h3>
                    <h1 className="first-tittle-modal">{nombre}</h1>
                    <h2 className="second-tittle-modal">{sigla}</h2>
                    <p className="parrafo-tarjeta">
                        <strong>Prerequisitos: </strong>
                        {prerequisitos.length > 0 ? prerequisitos.join(', ') : ' Ninguno'}
                    </p>
                    <p className="parrafo-tarjeta">{resumenText}</p>
                    <h3 className="third-tittle-modal">COMPETENCIAS DE LA ASIGNATURA</h3>
                    <p className="parrafo-tarjeta">{competenciasAsignaturaText}</p>
                    <h3 className="third-tittle-modal">COMPETENCIAS GENERICAS</h3>
                    <p className="parrafo-tarjeta">{competenciasGenericasText}</p>
                    <button
                        type="button"
                        className="info-btn"
                        aria-label="Mostrar más información"
                        onClick={() => setFlipped(true)}
                    >
                        Más información
                    </button>
                </div>
                <div className="card-back">
                    
                    <h1 className="first-tittle-modal">Video informativo</h1>
                        <iframe
                            width="99%"
                            height="99%"
                            src={video} // Usar la URL del video que se pasa o la predeterminada
                            title="YouTube video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    <button
                        type="button"
                        className="info-btn"
                        aria-label="Volver a la vista principal"
                        onClick={() => setFlipped(false)}
                    >
                        Volver
                    </button>
                </div>
            </div>
        </div>
    );
} export default Tarjeta;