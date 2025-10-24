import React, { useState } from 'react';
import FooterTwo from '../../components/Footer/FooterTwo';
import HeaderFive from '../../components/Header/HeaderFive';
import Modal from '../../components/Forms/Modal';
import ButtonWithArrow from '../../components/Forms/ButtonWithArrow';
import NoticiasFormComponent from '../../components/Forms/Formularios/NoticiasForm';
import Logo from '../../assets/img/logo/logo-white-2.png';
import EmpresasAliadasFormComponent from '../../components/Forms/Formularios/EmpresasAliadasForm';
import UsuariosFormComponent from '../../components/Forms/Formularios/UsuariosForm';
import DocentesForm from '../../components/Forms/Formularios/DocentesForm';
import AlumniForm from '../../components/Forms/Formularios/AlumniForm';
import CentroForm from '../../components/Forms/Formularios/CentroForm';
import SociedadForm from '../../components/Forms/Formularios/SociedadForm';
import CentroUsuarios from '../../components/Forms/Formularios/CentroUsuariosForm';
import SociedadUsuarios from '../../components/Forms/Formularios/SociedadUsuariosForm';

const Sandbox = () => {
    // Estados para manejar cada modal de manera independiente
    const [isNoticiasModalOpen, setNoticiasModalOpen] = useState(false);
    const [isEmpresasModalOpen, setEmpresasModalOpen] = useState(false);
    const [isUsuariosModalOpen, setUsuariosModalOpen] = useState(false);
    const [isDocentesModalOpen, setDocentesModalOpen] = useState(false);
    const [isAlumniModalOpen, setAlumniModalOpen] = useState(false);
    const [isCentroModalOpen, setCentroModalOpen] = useState(false);
    const [isSociedadModalOpen, setSociedadModalOpen] = useState(false);
    const [isCentroUsuariosModalOpen, setCentroUsuariosModalOpen] = useState(false);
    const [isSociedadUsuariosModalOpen, setSociedadUsuariosModalOpen] = useState(false);

    const toggleNoticiasModal = () => setNoticiasModalOpen(!isNoticiasModalOpen);
    const toggleEmpresasModal = () => setEmpresasModalOpen(!isEmpresasModalOpen);
    const toggleUsuariosModal = () => setUsuariosModalOpen(!isUsuariosModalOpen);
    const toggleDocentesModal = () => setDocentesModalOpen(!isDocentesModalOpen);
    const toggleAlumniModal = () => setAlumniModalOpen(!isAlumniModalOpen);
    const toggleCentroModal = () => setCentroModalOpen(!isCentroModalOpen);
    const toggleSociedadModal = () => setSociedadModalOpen(!isSociedadModalOpen);
    const toggleCentroUsuariosModal = () => setCentroUsuariosModalOpen(!isCentroUsuariosModalOpen);
    const toggleSociedadUsuariosModal = () => setSociedadUsuariosModalOpen(!isSociedadUsuariosModalOpen);
    
    const closeUsuariosModal = () => setUsuariosModalOpen(false);
    const closeDocentesModal = () => setDocentesModalOpen(false);
    const closeEmpresasModal = () => setEmpresasModalOpen(false);
    const closeNoticiasModal = () => setNoticiasModalOpen(false);
    const closeAlumniModal = () => setAlumniModalOpen(false);
    const closeCentroModal = () => setCentroModalOpen(false);
    const closeSociedadModal = () => setSociedadModalOpen(false);
    const closeCentroUsuariosModal = () => setCentroUsuariosModalOpen(false);
    const closeSociedadUsuariosModal = () => setSociedadUsuariosModalOpen(false); 

    return (
        <>
            <HeaderFive />
            <div className="container">
                <ButtonWithArrow text="Nueva Noticia" onClick={toggleNoticiasModal} />
                <Modal isOpen={isNoticiasModalOpen} onClose={toggleNoticiasModal}>
                    <NoticiasFormComponent onSuccess={closeNoticiasModal}/>
                </Modal>
            </div>
            <div className="container">
                <ButtonWithArrow text="Nueva Empresa Aliada" onClick={toggleEmpresasModal} />
                <Modal isOpen={isEmpresasModalOpen} onClose={toggleEmpresasModal}>
                    <EmpresasAliadasFormComponent onSuccess={closeEmpresasModal}/>
                </Modal>
            </div>
            <div className="container">
                <ButtonWithArrow text="Nuevo Usuario" onClick={toggleUsuariosModal} />
                <Modal isOpen={isUsuariosModalOpen} onClose={toggleUsuariosModal}>
                    <UsuariosFormComponent onSuccess={closeUsuariosModal} /> {/* Modificación */}
                </Modal>
            </div>
            <div className="container">
                <ButtonWithArrow text="Nuevo Docente" onClick={toggleDocentesModal} />
                <Modal isOpen={isDocentesModalOpen} onClose={toggleDocentesModal}>
                    <DocentesForm onSuccess={closeDocentesModal}/>
                </Modal>
            </div>
            <div className="container">
                <ButtonWithArrow text="Nuevo Alumno Graduado" onClick={toggleAlumniModal} />
                <Modal isOpen={isAlumniModalOpen} onClose={toggleAlumniModal}>
                    <AlumniForm onSuccess={closeAlumniModal}/>
                </Modal>
            </div>
            <div className="container">
                <ButtonWithArrow text="Nuevo Centro" onClick={toggleCentroModal} />
                <Modal isOpen={isCentroModalOpen} onClose={toggleCentroModal}>
                    <CentroForm onSuccess={closeCentroModal}/>
                </Modal>
            </div>
            <div className="container">
                <ButtonWithArrow text="Nueva Sociedad" onClick={toggleSociedadModal} />
                <Modal isOpen={isSociedadModalOpen} onClose={toggleSociedadModal}>
                    <SociedadForm onSuccess={closeSociedadModal}/>
                </Modal>
            </div>
            <div className="container">
                <ButtonWithArrow text="Nuevo Usuario de Centro" onClick={toggleCentroUsuariosModal} />
                <Modal isOpen={isCentroUsuariosModalOpen} onClose={toggleCentroUsuariosModal}>
                    <CentroUsuarios onSuccess={closeCentroUsuariosModal}/>
                </Modal>
            </div>
            <div className="container">
                <ButtonWithArrow text="Nuevo Usuario de Sociedad" onClick={toggleSociedadUsuariosModal} />
                <Modal isOpen={isSociedadUsuariosModalOpen} onClose={toggleSociedadUsuariosModal}>
                    <SociedadUsuarios onSuccess={closeSociedadUsuariosModal}/>
                </Modal>
            </div>

            <FooterTwo
                footerClass="it-footer-area it-footer-bg it-footer-style-5 ed-footer-style-5 inner-style black-bg pb-70"
                footerLogo={Logo}
                btnClass="it-btn-white sky-bg"
                copyrightTextClass="it-copyright-text inner-style text-center"
            />
        </>
    );
};

export default Sandbox;