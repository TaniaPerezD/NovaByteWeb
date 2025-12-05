import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Breadcrumb from '../Breadcrumb';
import HeaderMedico from '../Header/HeaderMedico';
import Logo from '../../assets/img/logo/logo-white-2.png';

const Layout = ({ children, routes }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const getCurrentRoute = () => {
    return routes.find(route => route.path === location.pathname) || routes[0];
  };

  const currentRoute = getCurrentRoute();

  return (
    <>
      <HeaderMedico />
      
      <div className="layout">

        <div className="layout_content">
          <div className="layout_header">
            <button 
              className="layout_menu-btn"
              onClick={toggleSidebar}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>

            <div className="breadcrumb-wrapper">
              <Breadcrumb 
                title={currentRoute.title}
                subtitle={currentRoute.breadcrumb}
              />
            </div>
          </div>

          <div className="layout_container">
            <Sidebar 
              routes={routes}
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
            />
            
            <div className="layout_body">
              {children}
            </div>
          </div>
        </div>

        {isSidebarOpen && (
          <div 
            className="layout_overlay"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
      
    </>
  );
};

export default Layout;