import React, { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import Breadcrumb from '../Breadcrumb';
import HeaderMedico from '../Header/HeaderMedico';

const Layout = ({ children, routes }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const params = useParams();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const getBasePath = () => {
    if (params.id) {
      return `/paciente-perfil/${params.id}`;
    }
    const pathSegments = location.pathname.split('/').filter(Boolean);
    return pathSegments.length > 0 ? `/${pathSegments[0]}` : '/';
  };

  const basePath = getBasePath();

  const getCurrentRoute = () => {
    if (params.id) {
        const currentSegment = location.pathname.split('/').pop() || 'informacion-general';
        return routes.find(route => route.path === currentSegment) || routes[0];
    }
    const foundRoute = routes.find(route => 
        location.pathname.endsWith(`/${route.path}`) || 
        location.pathname === basePath
    );

    return foundRoute || routes[0];
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
              basePath={basePath}
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