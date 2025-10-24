import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const MenuItems = ({ mobileMenu }) => {
  const [expandedMenu, setExpandedMenu] = useState(null);

  const toggleMenu = (menu) => {
    setExpandedMenu(expandedMenu === menu ? null : menu);
  };

  const handleClick = (e) => {
    if (mobileMenu) {
      e.preventDefault();
    }
  };

  return (
    <ul>
      <li>
        <Link to="/" onClick={handleClick}>
          <span>Home</span>
        </Link>
      </li>

      <li className="has-dropdown">
        <Link
          to="#"
          className={expandedMenu === 'nosotros' ? 'expanded' : ''}
          onClick={(e) => {
            e.preventDefault();
            toggleMenu('nosotros');
          }}
        >
          <span>Nosotros</span>
        </Link>
        <ul className={expandedMenu === 'nosotros' ? 'submenu d-block' : 'submenu'}>
          <li>
            <Link to="/alumni">Alumni</Link>
          </li>
          <li>
            <Link to="/sce">Sociedad Científica</Link>
          </li>
          <li>
            <Link to="/centro">Centro de Estudiantes</Link>
          </li>
          <li>
            <Link to="/teacher">Docentes</Link>
          </li>
        </ul>
      </li>

      <li className="has-dropdown">
        <Link
          to="#"
          className={expandedMenu === 'comunidad' ? 'expanded' : ''}
          onClick={(e) => {
            e.preventDefault();
            toggleMenu('comunidad');
          }}
        >
          <span>Comunidad</span>
        </Link>
        <ul className={expandedMenu === 'comunidad' ? 'submenu d-block' : 'submenu'}>
          <li>
            <Link to="/blog-1">Blog</Link>
          </li>
          <li>
            <Link to="/news">Noticias</Link>
          </li>
          <li>
            <Link to="/event">Eventos</Link>
          </li>
        </ul>
      </li>
      <li className="has-dropdown">
        <Link
          to="#"
          className={expandedMenu === 'academicos' ? 'expanded' : ''}
          onClick={(e) => {
            e.preventDefault();
            toggleMenu('academicos');
          }}
        >
          <span>Académico</span>
        </Link>
        <ul className={expandedMenu === 'academicos' ? 'submenu d-block' : 'submenu'}>
          <li>
            <Link to="/oportunidades">Empresas</Link>
          </li>
          <li>
            <Link to="/malla">Malla</Link>
          </li>
        </ul>
      </li>
      <li>
        <Link to="/faq" onClick={handleClick}>
          <span>FAQ's</span>
        </Link>
      </li>
      <li>
        <ThemeToggle />
      </li>
    </ul>
    
  );
}; export default MenuItems;
