import React from 'react';
import { Navigate } from 'react-router-dom';

const getCurrentUser = () => {
  const raw = localStorage.getItem('nb-user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
};

const ProtectedRoute = ({ children, allow = ['paciente', 'medico', 'medicoAdmin'] }) => {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (!allow.includes(user.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;