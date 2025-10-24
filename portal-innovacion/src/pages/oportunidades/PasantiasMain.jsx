import React, { useEffect} from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import Listado from '../../components/oportunidades/Listado';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
// import { Link } from 'react-router-dom';
import { getEmpresas } from './../../redux/empresas/thunk';
import SectionTitle from '../../components/SectionTitle';
import ButtonWithArrow from '../../components/Forms/ButtonWithArrow';
import Modal from '../../components/Forms/Modal';
import EmpresasAliadasFormComponent from '../../components/Forms/Formularios/EmpresasAliadasForm';

const PasantiasMain = () => {

  const [isEmpresasModalOpen, setEmpresasModalOpen] = useState(false);
  const dispatch = useDispatch()
  const empresasState = useSelector((state) => state.empresas);
  const userState = useSelector((state) => state.users);
  const [userRol, setUserRol] = useState("")
  useEffect(() => {
    dispatch(getEmpresas())
    setUserRol(localStorage.getItem("rol-ptin"))
  }, [dispatch])

  const toggleEmpresasModal = () => {
    console.log("toggleEmpresasModal")
    setEmpresasModalOpen(!isEmpresasModalOpen);
  }
  const closeEmpresasModal = () => setEmpresasModalOpen(false);
  
  return (
    <main>
      <Breadcrumb title="PRACTICAS PREPROFESIONALES" />
      <SectionTitle
          itemClass="it-team-title-box text-center"
          subTitleClass="ed-section-subtitle"
          subTitle="EMPRESAS ALIADAS"
          titleClass="ed-section-title"
          title="Conoce nuestras empresas aliadas"
      />
      {
          (userRol && (userRol === "administrativo" || userRol === "Administrador" || userRol === "administrativo"))
          ? 
          (
            <div className="container">
                <ButtonWithArrow text="Nueva Empresa Aliada" onClick={toggleEmpresasModal} />
                <Modal isOpen={isEmpresasModalOpen} onClose={toggleEmpresasModal}>
                    <EmpresasAliadasFormComponent onSuccess={closeEmpresasModal}/>
                </Modal>
            </div>
          )
          :
          (<>No es admi</>)
      }
      <Listado companies={empresasState.empresas} />
            
    </main>
  );
}; export default PasantiasMain;