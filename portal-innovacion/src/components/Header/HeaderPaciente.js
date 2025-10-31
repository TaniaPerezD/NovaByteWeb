import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/user/userSlice';
import { logoutSupabase } from '../../services/authService';
import MenuItems from './MenuItems';
import MenuItemsOnePage from './MenuItemsOnePage';
import Logo from '../../assets/img/logo/logoo.png';
import ThemeToggle from './ThemeToggle';
import Swal from 'sweetalert2';

// styles in _header-medico.scss (flat, pastel)

// Header específico para panel MÉDICO (como el mockup)
const HeaderMedico = ({ headerClass, headerLogo, onePage = false, parentMenu }) => {
  const dispatch = useDispatch();
  const usersState = useSelector((state) => state.users);
  const navigate = useNavigate();

  const [isVisible, setIsVisible] = useState(false);
  const [isOffCanvasOpen, setIsOffCanvasOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Quieres cerrar sesión?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar',
      });

      if (!result.isConfirmed) return;

      // 1. cerrar sesión en supabase (borra tokens del lado de supa si existen)
      try {
        await logoutSupabase();
      } catch (_) {
        // si falla, igual seguimos limpiando local
      }

      // 2. limpiar todo lo que usamos en el proyecto
      localStorage.removeItem('user-ptin');
      localStorage.removeItem('token-ptin');
      localStorage.removeItem('rol-ptin');
      localStorage.removeItem('uid-ptin');
      dispatch(logout());

      // 3. feedback y redirección
      await Swal.fire({
        title: 'Sesión cerrada',
        icon: 'success',
        timer: 1300,
        showConfirmButton: false,
      });

      navigate('/signin');
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo cerrar sesión. Intenta de nuevo.',
        icon: 'error',
      });
    }
  };

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <>
      <header className={headerClass ? headerClass : ''}>
        <div
          id="header-sticky"
          className={
            isVisible
              ? 'header-medico header-sticky'
              : 'header-medico'
          }
        >
          <div className="container-fluid" style={{ padding: '0 48px' }}>
            <div
              className="d-flex align-items-center justify-content-between"
              style={{ height: '92px' }}
            >
              {/* IZQUIERDA: label + logo */}
              <div className="d-flex align-items-center gap-4">
                <span style={{ color: '#B7B7B7', fontWeight: 500, fontSize: '24px' }}>
                  Paciente
                </span>
                <Link to="/" className="d-flex align-items-center">
                  <img
                    src={headerLogo ? headerLogo : Logo}
                    alt="Consultorio Ginecológico GIS"
                    style={{ height: '82px', width: 'auto' }}
                  />
                </Link>
              </div>

              {/* MENÚ CENTRAL igual al mockup */}
              <ul
                className="d-none d-xl-flex align-items-center"
                style={{ listStyle: 'none', gap: '80px', margin: 0, padding: 0, fontSize: '20px' }}
              >
                
                <li>
                
                  <Link to="/" style={{ transition: '0.3s', fontSize: '17px', color: 'black', textTransform:'capitalize', padding:'34px 0', display:'inline-block' }}>Inicio</Link>
                </li>
                <li>
                  <Link to="/" style={{  transition: '0.3s', fontSize: '17px', color: 'black', textTransform:'capitalize', padding:'34px 0', display:'inline-block' }}>Citas</Link>
                </li>
                <li style={{ position: 'relative' }}>
                  <Link to="/" style={{  transition: '0.3s', fontSize: '17px', color: 'black', textTransform:'capitalize', padding:'34px 0', display:'inline-block' }}>Autoexploración</Link>
                </li>
                <li>
                  <Link to="/" style={{  transition: '0.3s', fontSize: '17px', color: 'black', textTransform:'capitalize', padding:'34px 0', display:'inline-block'}}>
                    Historial Médico
                  </Link>
                </li>
                <li>
                  <Link to="/" style={{  transition: '0.3s', fontSize: '17px', color: 'black', textTransform:'capitalize', padding:'34px 0', display:'inline-block'}}>
                    Notificaciones
                  </Link>
                </li>
              </ul>
              {/* DERECHA: sol + cerrar sesión + hamburguesa móvil */}
              <div className="d-flex align-items-center gap-4">
                {/* sol círculo */}
                <li>
        <ThemeToggle />
      </li>

                {/* botón cerrar sesión (siempre en desktop) */}
                <button
                  onClick={handleLogout}
                  className="d-none d-lg-block"
                  style={{
                    background: '#D28584',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '18px 52px 18px 52px',
                    fontSize: '22px',
                    fontWeight: 600,
                     transition: '0.3s', fontSize: '17px', color: 'black', 
                    color: '#151515',
                    boxShadow: '0 25px 45px rgba(210,133,132,0.45)',
                  }}
                >
                  Cerrar Sesión
                </button>

                {/* hamburguesa */}
                <div className="d-lg-none">
                  <button
                    className="it-menu-bar"
                    onClick={() => setIsOffCanvasOpen(true)}
                    style={{ background: 'transparent', border: 'none' }}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M10 18.3333C10 17.4128 10.7462 16.6667 11.6667 16.6667H21.6667C22.5872 16.6667 23.3333 17.4128 23.3333 18.3333C23.3333 19.2538 22.5872 20 21.6667 20H11.6667C10.7462 20 10 19.2538 10 18.3333ZM0 1.66667C0 0.746183 0.746183 0 1.66667 0H21.6667C22.5872 0 23.3333 0.746183 23.3333 1.66667C23.3333 2.58713 22.5872 3.33333 21.6667 3.33333H1.66667C0.746183 3.33333 0 2.58713 0 1.66667ZM0 10C0 9.07953 0.746183 8.33333 1.66667 8.33333H21.6667C22.5872 8.33333 23.3333 9.07953 23.3333 10C23.3333 10.9205 22.5872 11.6667 21.6667 11.6667H1.66667C0.746183 11.6667 0 10.9205 0 10Z"
                        fill="#192332"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* línea inferior */}
          <div style={{ height: '3px', background: '#E4C6B4' }}></div>
        </div>
      </header>

      {/* OFFCANVAS mobile */}
      <div className="it-offcanvas-area">
        <div className={isOffCanvasOpen ? 'itoffcanvas opened' : 'itoffcanvas'}>
          <div className="itoffcanvas__close-btn">
            <button className="close-btn" onClick={() => setIsOffCanvasOpen(false)}>
              <i className="fal fa-times"></i>
            </button>
          </div>
          <div className="itoffcanvas__logo">
            <Link to="/">
              <img src={Logo} alt="Consultorio Ginecológico GIS" />
            </Link>
          </div>
          <div className="it-menu-mobile d-lg-none">
            <Link to="/" onClick={() => setIsOffCanvasOpen(false)}>Inicio</Link>
            <Link to="/" onClick={() => setIsOffCanvasOpen(false)}>Citas</Link>
            <Link to="/" onClick={() => setIsOffCanvasOpen(false)}>Autoexploración</Link>
            <Link to="/" onClick={() => setIsOffCanvasOpen(false)}>Historial Médico</Link>
            <Link to="/" onClick={() => setIsOffCanvasOpen(false)}>Notificaciones</Link>
          </div>
          <div style={{ padding: '20px 15px' }}>
            <button
              onClick={handleLogout}
              style={{
                 transition: '0.3s', fontSize: '17px', color: 'black', textTransform:'capitalize', padding:'34px 0', display:'inline-block'
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {isOffCanvasOpen ? (
        <div className="body-overlay apply" onClick={() => setIsOffCanvasOpen(false)}></div>
      ) : (
        <div className="body-overlay"></div>
      )}
    </>
  );
};

export default HeaderMedico;