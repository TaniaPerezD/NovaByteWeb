import HeaderPaciente from '../../components/Header/HeaderPaciente';
import FooterTwo from '../../components/Footer/FooterTwo';

import AgendarCita from "./agendarCitaMain";

import Logo from '../../assets/img/logo/logo-innovacion-3.png';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setUser } from '../../redux/user/userSlice';

const MainPage = () => {
  const dispatch = useDispatch()
  const [showMuñequito, setShowMuñequito] = useState(true);
  useEffect(() => {
    const user = localStorage.getItem("user-ptin")
    const token = localStorage.getItem("token-ptin")
    const rol = localStorage.getItem("rol-ptin")
    const uid = localStorage.getItem("uid-ptin")

    if (user && token && rol && uid) {
      dispatch(setUser({
        name: user,
        token,
        rol,
        uid
      }))
    }
  }, [dispatch])
  
  
  return (
    <>
      <HeaderPaciente />

      <AgendarCita />
      
      <FooterTwo
        footerClass="it-footer-area it-footer-bg it-footer-style-5 ed-footer-style-2 ed-footer-style-3 black-bg pb-70"
        footerLogo={Logo}
        btnClass="it-btn-white purple-2"
      />
    </>
  );
};
export default MainPage;
