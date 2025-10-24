import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MenuItems from './MenuItems';
import MenuItemsOnePage from './MenuItemsOnePage';
import Logo from '../../assets/img/logo/logo-innovacion-3.png';
import OffCanvasInsta from '../OffCanvas';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/user/userSlice';

const HeaderThree = (props) => {
  const usersState = useSelector((state) => state.users);
  const dispatch = useDispatch()

  const { headerClass, headerLogo, onePage, parentMenu } = props;
  const [isVisible, setIsVisible] = useState(false);
  const [isOffCanvasOpen, setIsOffCanvasOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout())
    localStorage.removeItem("user-ptin")
    localStorage.removeItem("token-ptin")
    localStorage.removeItem("rol-ptin")
    localStorage.removeItem("uid-ptin")
  }

  useEffect(() => {
    // Sticky Header is displayed after scrolling for 400 pixels
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
          className={`${
            isVisible
              ? ' ed-header-transparent ed-header-3-style mt-20 z-index-11 header-sticky'
              : ' ed-header-transparent ed-header-3-style mt-20 z-index-11'
          }
           
          `}
        >
          <div className="ed-header-3-area">
            <div className="container">
              <div className="ed-header-3-wrapper">
                <div className="row align-items-center">
                  <div className="col-xl-2 col-lg-2 col-md-2 col-2">
                    <div className="ed-header-3-logo">
                      <Link to="/">
                        <img src={headerLogo ? headerLogo : Logo} alt="" />
                      </Link>
                    </div>
                  </div>
                  <div className="col-xl-8 d-none d-xl-block">
                    <div className="ed-header-2-main-menu it-main-menu">
                      <nav className="it-menu-content">
                        {!onePage ? (
                          <MenuItems />
                        ) : (
                          <MenuItemsOnePage
                            parentMenu={parentMenu}
                            onePageStyle="onePage3"
                          />
                        )}
                      </nav>
                    </div>
                  </div>
                  <div className="col-xl-2 col-lg-2 col-md-2 col-2">
                    <div className="ed-header-3-right d-flex justify-content-end align-items-center">
                      <div className="ed-header-3-bar d-xl-none">
                        <button
                          className="it-menu-bar"
                          onClick={() => setIsOffCanvasOpen(true)}
                        >
                          <svg
                            width="24"
                            height="20"
                            viewBox="0 0 24 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M10 18.3333C10 17.4128 10.7462 16.6667 11.6667 16.6667H21.6667C22.5872 16.6667 23.3333 17.4128 23.3333 18.3333C23.3333 19.2538 22.5872 20 21.6667 20H11.6667C10.7462 20 10 19.2538 10 18.3333ZM0 1.66667C0 0.746183 0.746183 0 1.66667 0H21.6667C22.5872 0 23.3333 0.746183 23.3333 1.66667C23.3333 2.58713 22.5872 3.33333 21.6667 3.33333H1.66667C0.746183 3.33333 0 2.58713 0 1.66667ZM0 10C0 9.07953 0.746183 8.33333 1.66667 8.33333H21.6667C22.5872 8.33333 23.3333 9.07953 23.3333 10C23.3333 10.9205 22.5872 11.6667 21.6667 11.6667H1.66667C0.746183 11.6667 0 10.9205 0 10Z"
                              fill="#0E2A46"
                            />
                          </svg>
                        </button>
                      </div>
                      
                      {
                        (usersState.uid) 
                        ? (
                          <div>
                            <div className="ed-header-3-button d-none d-lg-block">
                              <button className="ed-btn-square" onClick={handleLogout}>
                                Cerrar sesión
                              </button>
                            </div>
                          </div>
                          )
                        : (<div className="ed-header-3-button d-none d-lg-block">
                            <Link className="ed-btn-square" to="/signin">
                              Iniciar sesión
                            </Link>
                          </div>)
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="it-offcanvas-area">
        <div className={isOffCanvasOpen ? 'itoffcanvas opened' : 'itoffcanvas'}>
          <div className="it-offcanva-bottom-shape d-none d-xxl-block"></div>
          <div className="itoffcanvas__close-btn">
            <button
              className="close-btn"
              onClick={() => setIsOffCanvasOpen(false)}
            >
              <i className="fal fa-times"></i>
            </button>
          </div>
          <div className="itoffcanvas__logo">
            <Link to="/">
              <img src={Logo} alt="" />
            </Link>
          </div>
          <div className="it-menu-mobile d-xl-none">
            {!onePage ? (
              <MenuItems mobileMenu="show" />
            ) : (
              <MenuItemsOnePage
                parentMenu={parentMenu}
                onePageStyle="onePage3"
                mobileMenu="show"
              />
            )}
          </div>
          <div className="itoffcanvas__info">
            <h3 className="offcanva-title">Mantente en contacto</h3>
            <div className="it-info-wrapper mb-20 d-flex align-items-center">
              <div className="itoffcanvas__info-icon">
                <a href="maito:innovacion@ucb.edu.bo">
                  <i className="fal fa-envelope"></i>
                </a>
              </div>
              <div className="itoffcanvas__info-address">
                <span>Correo electrónico</span>
                <a href="maito:innovacion@ucb.edu.bo">innovacion@ucb.edu.bo</a>
              </div>
            </div>
            <div className="it-info-wrapper mb-20 d-flex align-items-center">
              <div className="itoffcanvas__info-icon">
                <a href="tel:(+591)2782222">
                  <i className="fal fa-phone-alt"></i>
                </a>
              </div>
              <div className="itoffcanvas__info-address">
                <span>Teléfono</span>
                <a href="tel:(+591)2782222">(+591) 2782222</a>
              </div>
            </div>
            <div className="it-info-wrapper mb-20 d-flex align-items-center">
              <div className="itoffcanvas__info-icon">
                <a href="htits://www.google.com/maps/@37.4801311,22.8928877,3z">
                  <i className="fas fa-map-marker-alt"></i>
                </a>
              </div>
              <div className="itoffcanvas__info-address">
                <span>Dirección</span>
                <a
                  href="htits://www.google.com/maps/@37.4801311,22.8928877,3z"
                  target="_blank" rel="noreferrer"
                >
                  Av. 14 de Septiembre N° 4807, Obrajes
                </a>
              </div>
            </div>
          </div>
          <OffCanvasInsta />
        </div>
      </div>

      {isOffCanvasOpen ? (
        <div
          className="body-overlay apply"
          onClick={() => setIsOffCanvasOpen(false)}
        ></div>
      ) : (
        <div className="body-overlay"></div>
      )}
    </>
  );
};
export default HeaderThree;
