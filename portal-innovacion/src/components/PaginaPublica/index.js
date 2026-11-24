import React from 'react';
import HeaderFive from '../Header/HeaderFive';
import HeaderPaciente from '../Header/HeaderPaciente';
import HeaderMedico from '../Header/HeaderMedico';
import FooterTwo from '../Footer/FooterTwo';
import Logo from '../../assets/img/logo/logo-white-2.png';

// Marco común de las páginas informativas y de la paciente: el encabezado depende del rol guardado
// (solo para elegir el menú; el acceso a los datos lo decide siempre el servidor).
const rolLocal = () => {
  try {
    return JSON.parse(localStorage.getItem('nb-user') || '{}').rol;
  } catch (e) {
    return null;
  }
};

const PaginaPublica = ({ children }) => {
  const rol = rolLocal();
  const Header = rol === 'paciente' ? HeaderPaciente : rol === 'medico' || rol === 'medicoAdmin' ? HeaderMedico : HeaderFive;
  return (
    <>
      <Header />
      {children}
      <FooterTwo
        footerClass="it-footer-area it-footer-bg it-footer-style-5 ed-footer-style-5 inner-style black-bg pb-70"
        footerLogo={Logo}
        btnClass="it-btn-white sky-bg"
        copyrightTextClass="it-copyright-text inner-style text-center"
      />
    </>
  );
};

export default PaginaPublica;
