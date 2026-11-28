import React from 'react';
import HeaderPaciente from '../../components/Header/HeaderPaciente';
import HeaderMedico from '../../components/Header/HeaderMedico';
import MiActividadMain from './MiActividadMain';
import FooterTwo from '../../components/Footer/FooterTwo';

import Logo from '../../assets/img/logo/logo-white-2.png';

// El menú depende del rol: la paciente ve el suyo (con «Cerrar sesión»), el personal ve el del panel médico.
const rolLocal = () => {
  try {
    return JSON.parse(localStorage.getItem('nb-user') || '{}').rol;
  } catch (e) {
    return null;
  }
};

const MiActividad = () => {
  const Header = rolLocal() === 'paciente' ? HeaderPaciente : HeaderMedico;
  return (
    <>
      <Header />

      <MiActividadMain />

      <FooterTwo
        footerClass="it-footer-area it-footer-bg it-footer-style-5 ed-footer-style-5 inner-style black-bg pb-70"
        footerLogo={Logo}
        btnClass="it-btn-white sky-bg"
        copyrightTextClass="it-copyright-text inner-style text-center"
      />
    </>
  );
};

export default MiActividad;
