import React, { useEffect } from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import SingleTeamThree from '../../components/Team/SingleTeamThree';
import KnowUs from '../../components/Sce/KnowUs';

import { useState } from 'react';
import teamImg8 from '../../assets/img/team/team-4-8.jpg';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { getSociedad } from '../../redux/sociedad/thunk';

import ButtonWithArrow from '../../components/Forms/ButtonWithArrow';
import Modal from '../../components/Forms/Modal';
import SociedadForm from '../../components/Forms/Formularios/SociedadForm';
import SociedadUsuarios from '../../components/Forms/Formularios/SociedadUsuariosForm';
import { getUsociedad } from '../../redux/usociedad/thunk';

const SceMain = () => {
  const usociedadState = useSelector((state) => state.usociedad);
  const [isSociedadModalOpen, setIsSociedadModalOpen] = useState(false);
  const [isSociedadUsuariosModalOpen, setIsSociedadUsuariosModalOpen] = useState(false);
  const sociedadState = useSelector((state) => state.sociedad);
  const userState = useSelector((state) => state.users);
  const dispatch = useDispatch()
  

  useEffect(() => {
    dispatch(getSociedad())
    dispatch(getUsociedad())
  }, [dispatch])

  const toggleSociedadModal = () => {
    setIsSociedadModalOpen(!isSociedadModalOpen);
  };
  const toggleSociedadUsuariosModal = () => {
    setIsSociedadUsuariosModalOpen(!isSociedadUsuariosModalOpen);
  };
  const closeSociedadUsuariosModal = () => setIsSociedadUsuariosModalOpen(false);
  const closeSociedadModal = () => setIsSociedadModalOpen(false);

  return (
    <main>
      <Breadcrumb title="SOCIEDAD CIENTIFICA ESTUDIANTIL" />

      <div className="ed-team-area p-relative inner-style fix z-index pt-110 pb-90">
        {
          (!sociedadState.isLoading)
          ? 
          (
            <div className="container">
            {
                  (userState.rol && (userState.rol === "administrativo" || userState.rol === "Administrador" || userState.rol === "administrativo"))
                  ? 
                  (
                    <div className="container">
                    <ButtonWithArrow text="Nueva Sociedad" onClick={toggleSociedadModal} />
                    <Modal isOpen={isSociedadModalOpen} onClose={toggleSociedadModal}>
                        <SociedadForm onSuccess={closeSociedadModal}/>
                    </Modal>
                    
                    </div>
                  )
                  :
                  (<></>)
                }
                <div style={{ marginBottom: '30px' }}></div>
              <KnowUs
                title="Conoce a nuestra Sociedad Científica Estudiantil"
                
                subtitle={sociedadState.sociedad.name}
                paragraph={sociedadState.sociedad.objetive}
                image={teamImg8}
              />
              
              {
                (userState.rol && (userState.rol === "administrativo" || userState.rol === "Administrador" || userState.rol === "administrativo"))
                ? 
                (
                  <div className="container">
                  <ButtonWithArrow text="Nuevo Miembro" onClick={toggleSociedadUsuariosModal} />
                  <Modal isOpen={isSociedadUsuariosModalOpen} onClose={toggleSociedadUsuariosModal}>
                      <SociedadUsuarios onSuccess={closeSociedadUsuariosModal}/>
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
                  (usociedadState)
                  ?
                  (usociedadState.usociedad.map((member, index) => (
                    <div key={index} className="col-xl-3 col-lg-4 col-md-6 col-sm-6 mb-30">
                      <SingleTeamThree
                        teamImage={""}
                        authorName={member.usuario.name ?? ""}
                        designation={member.role ?? ""}
                        socialLinks={member.socialLinks}
                        companyData={member}
                        id={member.id}
                        onEditSuccess={() => console.log('Edited')}
                        exampleEditForm={SociedadUsuarios}
                      />
                    </div>
                  )))
                  :
                  (<>No hay sociedad</>)
                }
              </div>
            </div>
          )
          : (<p>Sociedad no encontrada</p>)
        }
      </div>
    </main>
  );
}; export default SceMain;