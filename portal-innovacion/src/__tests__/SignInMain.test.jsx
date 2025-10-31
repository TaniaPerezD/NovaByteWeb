import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignInMain from '../pages/signin/SignInMain';
import * as authService from '../services/authService';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { useForm } from '../hooks/useForm';

// Mock de useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: 'a',
}));

// Mock de useForm
jest.mock('../hooks/useForm', () => ({
  useForm: jest.fn(),
}));

// Mock de Swal
jest.mock('sweetalert2', () => ({
  fire: jest.fn(),
}));

// Mock de loginStep1
jest.mock('../services/authService', () => ({
  loginStep1: jest.fn(),
}));

// Mock de Breadcrumb
jest.mock('../components/Breadcrumb', () => () => <div>Breadcrumb Mock</div>);

// Mock de componentes SVG e iconos
jest.mock('../components/SVG', () => () => <svg data-testid="right-arrow" />);
jest.mock('react-icons/fa', () => ({
  FaEye: () => <span data-testid="eye-icon" />,
  FaEyeSlash: () => <span data-testid="eye-slash-icon" />,
}));

// Mock de imagen
jest.mock('../assets/img/contact/signin.jpg', () => 'test-image.jpg');

describe('SignInMain', () => {
  const mockHandleInputChange = jest.fn();
  const mockReset = jest.fn();

  beforeEach(() => {
    mockNavigate.mockReset();
    mockHandleInputChange.mockReset();
    mockReset.mockReset();
    Swal.fire.mockReset();
    Swal.fire.mockResolvedValue({}); // ← IMPORTANTE: Mock de Promise

    useForm.mockReturnValue([
      { email: '', password: '' },
      mockHandleInputChange,
      mockReset,
    ]);

    authService.loginStep1.mockRejectedValue(new Error('Credenciales inválidas'));
  });

  it('Renderiza el formulario de inicio de sesión correctamente', () => {
    render(<SignInMain />);

    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Correo Electrónico')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toHaveTextContent('Ingresar');
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).not.toBeDisabled(); // ← Verificar estado inicial
  });

  it('shows password when eye icon is clicked', async () => {
    render(<SignInMain />);

    const passwordInput = screen.getByTestId('password-input');
    const eyeIconParent = screen.getByTestId('eye-icon').parentElement; // ← Click en el parent

    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(screen.getByTestId('eye-icon')).toBeInTheDocument();

    await userEvent.click(eyeIconParent); // ← Click en el span padre

    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByTestId('eye-slash-icon')).toBeInTheDocument();
    
    // Verificar que vuelve a cambiar
    await userEvent.click(eyeIconParent);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('actualiza los valores del formulario al cambiar la entrada', async () => {
    render(<SignInMain />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, '12345');

    expect(mockHandleInputChange).toHaveBeenCalled();
  });

  it('muestra un error si el correo electrónico es inválido', async () => {
    useForm.mockReturnValue([
      { email: 'invalid-email', password: '12345' },
      mockHandleInputChange,
      mockReset,
    ]);

    render(<SignInMain />);
    const submitButton = screen.getByTestId('login-button');

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'error',
          title: 'Ooops...',
          text: 'Correo electrónico inválido',
        })
      );
    });

    expect(authService.loginStep1).not.toHaveBeenCalled();
  });

  it('muestra un error si la contraseña es demasiado corta', async () => {
    useForm.mockReturnValue([
      { email: 'test@example.com', password: '12' }, // ← Menos de 4 caracteres
      mockHandleInputChange,
      mockReset,
    ]);

    render(<SignInMain />);
    const submitButton = screen.getByTestId('login-button');

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'error',
          title: 'Ooops...',
          text: 'La contraseña no debe estar vacía',
        })
      );
    });

    expect(authService.loginStep1).not.toHaveBeenCalled();
  });

  it('llama a loginStep1 con las credenciales correctas', async () => {
    useForm.mockReturnValue([
      { email: 'test@example.com', password: '12345' },
      mockHandleInputChange,
      mockReset,
    ]);

    authService.loginStep1.mockResolvedValue({ ok: true });

    render(<SignInMain />);
    const submitButton = screen.getByTestId('login-button');

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(authService.loginStep1).toHaveBeenCalledWith('test@example.com', '12345');
    });

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'success',
          title: 'Código enviado',
          text: 'Te enviamos un código de verificación a tu correo.',
          confirmButtonColor: '#E79796',
        })
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      `/two-verification?email=${encodeURIComponent('test@example.com')}`
    );
  });

  it('muestra un error si las credenciales son inválidas', async () => {
    useForm.mockReturnValue([
      { email: 'test@example.com', password: 'wrong' },
      mockHandleInputChange,
      mockReset,
    ]);

    authService.loginStep1.mockRejectedValue(new Error('Credenciales inválidas'));

    render(<SignInMain />);
    const submitButton = screen.getByTestId('login-button');

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(authService.loginStep1).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'error',
          title: 'No se pudo iniciar sesión',
          text: 'Credenciales inválidas',
          confirmButtonColor: '#E79796',
        })
      );
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('desactiva el botón y muestra texto de carga durante el envío', async () => {
    useForm.mockReturnValue([
      { email: 'test@example.com', password: '12345' },
      mockHandleInputChange,
      mockReset,
    ]);

    // ← Promise con delay para simular carga
    authService.loginStep1.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({}), 100))
    );

    render(<SignInMain />);
    const submitButton = screen.getByTestId('login-button');

    await userEvent.click(submitButton);

    // Verificar estado de carga
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Enviando...');
    });
    
    expect(screen.queryByTestId('right-arrow')).not.toBeInTheDocument();

    // Esperar a que termine
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    }, { timeout: 3000 });
  });

  it('renders "Olvidaste tu contraseña?" link with correct href', () => {
    render(<SignInMain />);
    const forgotLink = screen.getByText('¿Olvidaste tu contraseña?');

    expect(forgotLink).toBeInTheDocument();
    expect(forgotLink.closest('a')).toHaveAttribute('href', '/reset-password');
  });
});