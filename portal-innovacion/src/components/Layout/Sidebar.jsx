import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { IoMdClose } from "react-icons/io"; 

const Sidebar = ({ routes, isOpen, onClose, basePath = '/' }) => {
  const location = useLocation();

  const getFullPath = (routePath) => {
    const cleanedBasePath = basePath.replace(/\/$/, '');
    const cleanedRoutePath = routePath.replace(/^\//, '');

    if (!cleanedRoutePath) {
      return cleanedBasePath;
    }
    
    return `${cleanedBasePath}/${cleanedRoutePath}`;
  };

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      <div className="sidebar_header">
        <h2 className="sidebar_logo">Panel Medico</h2>
        <button 
          className="sidebar_close"
          onClick={onClose}
          aria-label="Cerrar sidebar"
        >
          <IoMdClose />
        </button>
      </div>

      <nav className="sidebar_nav">
        {routes.map((route, index) => {
          const fullPath = getFullPath(route.path);

          return (
            <NavLink
              key={index}
              to={fullPath}
              className={({ isActive }) => 
                `sidebar_link ${isActive ? 'sidebar_link--active' : ''}`
              }
              onClick={onClose}
              end={true}
            >
              <span className="sidebar_icon">{route.icon}</span>
              <span className="sidebar_text">{route.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar_footer">
        <div className="sidebar_user-info">
          <p>Dra. Anita</p>
          <small>Médico General</small>
        </div>
      </div>
    </aside>
  );
}; export default Sidebar;