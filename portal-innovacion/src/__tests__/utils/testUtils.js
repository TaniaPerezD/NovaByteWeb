import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';

export const renderWithRouter = (ui, options = {}) => {
  const Wrapper = ({ children }) => (
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

export const mockUser = {
  id: '123',
  email: 'test@example.com',
  user_metadata: { role: 'paciente' },
};

export const mockMedico = {
  id: '456',
  email: 'medico@example.com',
  user_metadata: { role: 'medico' },
};

export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};