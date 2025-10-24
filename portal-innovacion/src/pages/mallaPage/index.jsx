import React from 'react';
import FooterTwo from '../../components/Footer/FooterTwo';
import HeaderFive from '../../components/Header/HeaderFive';

import Logo from '../../assets/img/logo/logo-white-2.png';
import MallaPageMain from './MallaPageMain';

const MallaPage = () => {
  return (
    <>
      <HeaderFive />

      <MallaPageMain/>

      <FooterTwo
        footerClass="it-footer-area it-footer-bg it-footer-style-5 ed-footer-style-5 inner-style black-bg pb-70"
        footerLogo={Logo}
        btnClass="it-btn-white sky-bg"
        copyrightTextClass="it-copyright-text inner-style text-center"
      />
    </>
  );
};
export default MallaPage;