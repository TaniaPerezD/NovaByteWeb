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
      <li>
        <Link to="/nosotros" onClick={handleClick}>
          <span>Nosotros</span>
        </Link>
      </li>
      <li>
        <Link to="/citas" onClick={handleClick}>
          <span>Citas</span>
        </Link>
      </li>
      <li>
        <Link to="/servicios" onClick={handleClick}>
          <span>Servicios</span>
        </Link>
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
