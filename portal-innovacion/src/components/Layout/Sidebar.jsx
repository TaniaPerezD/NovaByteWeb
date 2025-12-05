import React from 'react';
import { NavLink } from 'react-router-dom';
import { IoMdClose } from "react-icons/io"; 

// TO DO: poner props para los datos y si es panel de medico o persona

const Sidebar = ({ routes, isOpen, onClose }) => {
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
        {routes.map((route, index) => (
          <NavLink
            key={index}
            to={route.path}
            className={({ isActive }) => 
              `sidebar_link ${isActive ? 'sidebar_link--active' : ''}`
            }
            onClick={onClose}
          >
            <span className="sidebar_icon">{route.icon}</span>
            <span className="sidebar_text">{route.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar_footer">
        <div className="sidebar_user-info">
          <p>Dra. Anita</p>
          <small>Médico General</small>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;