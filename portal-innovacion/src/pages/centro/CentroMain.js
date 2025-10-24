import React, { useEffect } from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import SingleTeamThree from '../../components/Team/SingleTeamThree';
import KnowUs from '../../components/Sce/KnowUs';
import Logo from '../../assets/img/logo/logo-white-2.png';

import { useState } from 'react';
import logoCentro from '../../assets/img/centro/logo-centro.jpeg';
import HeaderFive from '../../components/Header/HeaderFive';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { getCentro } from '../../redux/centro/thunk';
import { getUcentro } from '../../redux/ucentro/thunk';

import ButtonWithArrow from '../../components/Forms/ButtonWithArrow';
import Modal from '../../components/Forms/Modal';
import CentroForm from '../../components/Forms/Formularios/CentroForm.jsx';
import CentroUsuarios from '../../components/Forms/Formularios/CentroUsuariosForm.jsx';
import FooterTwo from '../../components/Footer/FooterTwo.js';

const CentroMain = () => {
  const userState = useSelector((state) => state.users);
  const centroState = useSelector((state) => state.centro);
  const ucentroState = useSelector((state) => state.ucentro);
  const dispatch = useDispatch();
  const [isCentroModalOpen, setIsCentroModalOpen] = useState(false);
  const [isCentroUsuariosModalOpen, setIsCentroUsuariosModalOpen] = useState(false);

  const toggleCentroUsuariosModal = () => {
    setIsCentroUsuariosModalOpen(!isCentroUsuariosModalOpen);
  };

  const closeCentroUsuariosModal = () => {
    setIsCentroUsuariosModalOpen(false);
  };

  const toggleCentroModal = () => {
    setIsCentroModalOpen(!isCentroModalOpen);
  };

  const closeCentroModal = () => {
    setIsCentroModalOpen(false);
  };

  useEffect(() => {
    dispatch(getCentro())
    dispatch(getUcentro())
  }, [dispatch])
  return (
    <main>
      <HeaderFive />
      <Breadcrumb title="CENTRO DE ESTUDIANTES" />

      <div className="ed-team-area p-relative inner-style fix z-index pt-110 pb-90">
        {
          (centroState.isLoading)
          ? (<p>Centro no encontrado</p>)
          : 
          (
            <div className="container">
            {
                  (userState.rol && (userState.rol === "administrativo" || userState.rol === "Administrador" || userState.rol === "administrativo"))
                  ? 
                  (
                    <div className="container">
                    <ButtonWithArrow text="Nuevo Centro" onClick={toggleCentroModal} />
                    <Modal isOpen={isCentroModalOpen} onClose={toggleCentroModal}>
                        <CentroForm onSuccess={closeCentroModal}/>
                    </Modal>
                    
                    </div>
                  )
                  :
                  (<></>)
                }
                <div style={{ marginBottom: '30px' }}></div>
              <KnowUs
                title="Conoce a nuestra Centro de Estudiantes"
                subtitle={centroState.centros.name}
                paragraph={centroState.centros.objetive}
                image={logoCentro}
              />
             {
                (userState.rol && (userState.rol === "administrativo" || userState.rol === "Administrador" || userState.rol === "administrativo"))
                ? 
                (
                  <div className="container">
                  <ButtonWithArrow text="Nuevo miembro" onClick={toggleCentroUsuariosModal} />
                  <Modal isOpen={isCentroUsuariosModalOpen} onClose={toggleCentroUsuariosModal}>
                      <CentroUsuarios onSuccess={closeCentroUsuariosModal}/>
                  </Modal>
                    
                  </div>
                )
                :
                (<></>)
              }
              <div style={{ marginBottom: '30px' }}></div> 
              <div className="row">
              {/* <KnowUs
                title="Conoce a los minebros de nuestro Centro de Estudiantes"
              /> */}
                {
                  (ucentroState)
                  ?
                  (ucentroState.ucentro.map((member, index) => (
                    <div key={index} className="col-xl-3 col-lg-4 col-md-6 col-sm-6 mb-30">
                      <SingleTeamThree
                        teamImage={""}
                        authorName={member.usuario.name ?? ""}
                        designation={member.role ?? ""}
                        socialLinks={member.socialLinks}
                        companyData={member}
                        id={member.id}
                        onEditSuccess={() => console.log('Edited')}
                        exampleEditForm={CentroUsuarios}
                      />
                    </div>
                  )))
                  :
                  (<>No hay centro</>)
                }
              </div>
            </div>
          )
        }
      </div>
      <FooterTwo
          footerClass="it-footer-area it-footer-bg it-footer-style-5 ed-footer-style-5 inner-style black-bg pb-70"
          footerLogo={Logo}
          btnClass="it-btn-white sky-bg"
          copyrightTextClass="it-copyright-text inner-style text-center"
      />
    </main>
  );
}; export default CentroMain;
