import React from 'react';
import HeaderMedico from '../../components/Header/HeaderMedico';
import FooterTwo from '../../components/Footer/FooterTwo';

import MedicoMain from './MedicoMain';

import Logo from '../../assets/img/logo/logo-white-2.png';

const SignIn = () => {
  return (
    <>
      <HeaderMedico />

      <MedicoMain />

      <FooterTwo
        footerClass="it-footer-area it-footer-bg it-footer-style-5 ed-footer-style-5 inner-style black-bg pb-70"
        footerLogo={Logo}
        btnClass="it-btn-white sky-bg"
        copyrightTextClass="it-copyright-text inner-style text-center"
      />
    </>
  );
};

export default SignIn;
