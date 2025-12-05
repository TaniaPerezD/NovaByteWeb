import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ResetPasswordMain from '../pages/reset-password/ResetPasswordMain';
import * as authService from '../services/authService';
import Swal from 'sweetalert2';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from '../hooks/useForm';

// Mock de useNavigate
const mockNavigate = jest.fn();
const mockLocation = {
  pathname: '/reset-password',
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

// Mock de useForm
jest.mock('../hooks/useForm', () => ({
  useForm: jest.fn(),
}));

// Mock de Swal
jest.mock('sweetalert2', () => ({
  fire: jest.fn(),
}));

// Mock de sendResetPassword
jest.mock('../services/authService', () => ({
  sendResetPassword: jest.fn(),
}));

// Mock de Breadcrumb
jest.mock('../components/Breadcrumb', () => () => <div>Breadcrumb Mock</div>);

// Mock de imagen
jest.mock('../assets/img/contact/signin.jpg', () => 'signin-image.jpg');

// Helper para renderizar con Router
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ResetPasswordMain', () => {
  const mockHandleInputChange = jest.fn();
  const mockReset = jest.fn();

  beforeEach(() => {
    mockNavigate.mockReset();
    mockHandleInputChange.mockReset();
    mockReset.mockReset();
    Swal.fire.mockReset();
    Swal.fire.mockResolvedValue({});
    authService.sendResetPassword.mockReset();

    // Configuración por defecto de useForm
    useForm.mockReturnValue([
      { email: '' },
      mockHandleInputChange,
      mockReset,
    ]);
  });

  it('renderiza correctamente el formulario de recuperación', () => {
    renderWithRouter(<ResetPasswordMain />);

    expect(screen.getByText('Recuperar Contraseña')).toBeInTheDocument();
    expect(screen.getByText('Ingresa tu correo para recibir el enlace de recuperación')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ejemplo@correo.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enviar enlace de recuperación/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Volver al inicio de sesión/i })).toBeInTheDocument();
  });

  it('muestra error si el correo está vacío', async () => {
    useForm.mockReturnValue([
      { email: '' },
      mockHandleInputChange,
      mockReset,
    ]);

    renderWithRouter(<ResetPasswordMain />);
    const submitButton = screen.getByRole('button', { name: /Enviar enlace de recuperación/i });

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'error',
          title: 'Falta el correo',
          text: 'Ingresa tu correo para continuar.',
          confirmButtonColor: '#E79796',
        })
      );
    });

    expect(authService.sendResetPassword).not.toHaveBeenCalled();
  });

  it('muestra error si el correo tiene solo espacios', async () => {
    useForm.mockReturnValue([
      { email: '   ' },
      mockHandleInputChange,
      mockReset,
    ]);

    renderWithRouter(<ResetPasswordMain />);
    const submitButton = screen.getByRole('button', { name: /Enviar enlace de recuperación/i });

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'error',
          title: 'Falta el correo',
          text: 'Ingresa tu correo para continuar.',
        })
      );
    });

    expect(authService.sendResetPassword).not.toHaveBeenCalled();
  });

  it('muestra error si el correo no tiene formato válido', async () => {
    useForm.mockReturnValue([
      { email: 'correo-invalido' },
      mockHandleInputChange,
      mockReset,
    ]);

    renderWithRouter(<ResetPasswordMain />);
    const submitButton = screen.getByRole('button', { name: /Enviar enlace de recuperación/i });

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'error',
          title: 'Correo no válido',
          text: 'Revisa que esté bien escrito (ejemplo@dominio.com).',
          confirmButtonColor: '#E79796',
        })
      );
    });

    expect(authService.sendResetPassword).not.toHaveBeenCalled();
  });

  it('envía el correo de recuperación exitosamente', async () => {
    useForm.mockReturnValue([
      { email: 'latinoignas@gmail.com' },
      mockHandleInputChange,
      mockReset,
    ]);

    authService.sendResetPassword.mockResolvedValue({ ok: true });

    renderWithRouter(<ResetPasswordMain />);
    const submitButton = screen.getByRole('button', { name: /Enviar enlace de recuperación/i });

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(authService.sendResetPassword).toHaveBeenCalledWith('latinoignas@gmail.com');
    });

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'success',
          title: 'Correo enviado',
          html: expect.stringContaining('latinoignas@gmail.com'),
          confirmButtonColor: '#E79796',
        })
      );
    });

    expect(mockReset).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/signin');
  });

  it('muestra el email en el mensaje de éxito', async () => {
    useForm.mockReturnValue([
      { email: 'usuario@correo.com' },
      mockHandleInputChange,
      mockReset,
    ]);

    authService.sendResetPassword.mockResolvedValue({ ok: true });

    renderWithRouter(<ResetPasswordMain />);
    const submitButton = screen.getByRole('button', { name: /Enviar enlace de recuperación/i });

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('usuario@correo.com'),
        })
      );
    });
  });

  it('muestra error si falla el envío del correo', async () => {
    useForm.mockReturnValue([
      { email: 'test@example.com' },
      mockHandleInputChange,
      mockReset,
    ]);

    authService.sendResetPassword.mockRejectedValue(
      new Error('No se pudo enviar el correo de recuperación')
    );

    renderWithRouter(<ResetPasswordMain />);
    const submitButton = screen.getByRole('button', { name: /Enviar enlace de recuperación/i });

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(authService.sendResetPassword).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'error',
          title: 'No se pudo enviar',
          text: 'No se pudo enviar el correo de recuperación',
          confirmButtonColor: '#E79796',
        })
      );
    });

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockReset).not.toHaveBeenCalled();
  });

  it('muestra mensaje específico para error de CORS', async () => {
    useForm.mockReturnValue([
      { email: 'test@example.com' },
      mockHandleInputChange,
      mockReset,
    ]);

    authService.sendResetPassword.mockRejectedValue(new Error('Failed to fetch'));

    renderWithRouter(<ResetPasswordMain />);
    const submitButton = screen.getByRole('button', { name: /Enviar enlace de recuperación/i });

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'error',
          title: 'No se pudo enviar',
          text: 'No pudimos contactar al servidor. Revisa que la función tenga el CORS correcto.',
          confirmButtonColor: '#E79796',
        })
      );
    });
  });

  it('desactiva campos y botones durante el envío', async () => {
    useForm.mockReturnValue([
      { email: 'test@example.com' },
      mockHandleInputChange,
      mockReset,
    ]);

    authService.sendResetPassword.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 100))
    );

    renderWithRouter(<ResetPasswordMain />);
    
    const emailInput = screen.getByLabelText('Correo electrónico');
    const submitButton = screen.getByRole('button', { name: /Enviar enlace de recuperación/i });
    const backButton = screen.getByRole('button', { name: /Volver al inicio de sesión/i });

    await userEvent.click(submitButton);

    // Verificar estado de carga
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Enviando...');
      expect(emailInput).toBeDisabled();
      expect(backButton).toBeDisabled();
    });

    // Esperar a que termine
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    }, { timeout: 3000 });
  });

  it('actualiza el valor del correo al escribir', async () => {
    renderWithRouter(<ResetPasswordMain />);

    const emailInput = screen.getByLabelText('Correo electrónico');

    await userEvent.type(emailInput, 'test@example.com');

    expect(mockHandleInputChange).toHaveBeenCalled();
  });

  it('navega a /signin al hacer click en volver', async () => {
    renderWithRouter(<ResetPasswordMain />);

    const backButton = screen.getByRole('button', { name: /Volver al inicio de sesión/i });

    await userEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/signin');
  });

  it('el botón de volver no envía el formulario', async () => {
    renderWithRouter(<ResetPasswordMain />);

    const backButton = screen.getByRole('button', { name: /Volver al inicio de sesión/i });

    expect(backButton).toHaveAttribute('type', 'button');
  });

  it('el input tiene autoComplete off', () => {
    renderWithRouter(<ResetPasswordMain />);

    const emailInput = screen.getByLabelText('Correo electrónico');

    expect(emailInput).toHaveAttribute('autocomplete', 'off');
  });

  it('el input tiene el tipo email', () => {
    renderWithRouter(<ResetPasswordMain />);

    const emailInput = screen.getByLabelText('Correo electrónico');

    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('maneja errores sin mensaje correctamente', async () => {
    useForm.mockReturnValue([
      { email: 'test@example.com' },
      mockHandleInputChange,
      mockReset,
    ]);

    // Error sin mensaje específico
    authService.sendResetPassword.mockRejectedValue(new Error());

    renderWithRouter(<ResetPasswordMain />);
    const submitButton = screen.getByRole('button', { name: /Enviar enlace de recuperación/i });

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'error',
          title: 'No se pudo enviar',
          text: 'Hubo un problema al enviar el correo de recuperación.',
        })
      );
    });
  });

  it('el formulario previene el envío por defecto', async () => {
    useForm.mockReturnValue([
      { email: 'test@example.com' },
      mockHandleInputChange,
      mockReset,
    ]);

    authService.sendResetPassword.mockResolvedValue({ ok: true });

    renderWithRouter(<ResetPasswordMain />);
    
    const form = screen.getByRole('button', { name: /Enviar enlace de recuperación/i }).closest('form');
    
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');
    
    form?.dispatchEvent(submitEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('resetea el formulario solo después de envío exitoso', async () => {
    useForm.mockReturnValue([
      { email: 'test@example.com' },
      mockHandleInputChange,
      mockReset,
    ]);

    authService.sendResetPassword.mockResolvedValue({ ok: true });

    renderWithRouter(<ResetPasswordMain />);
    const submitButton = screen.getByRole('button', { name: /Enviar enlace de recuperación/i });

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalled();
    });

    // Verificar que NO se resetea si falla
    mockReset.mockClear();
    authService.sendResetPassword.mockRejectedValue(new Error('Error'));
    
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(authService.sendResetPassword).toHaveBeenCalled();
    });

    expect(mockReset).not.toHaveBeenCalled();
  });

  it('el botón de enviar tiene los estilos correctos de loading', async () => {
    useForm.mockReturnValue([
      { email: 'test@example.com' },
      mockHandleInputChange,
      mockReset,
    ]);

    authService.sendResetPassword.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 100))
    );

    renderWithRouter(<ResetPasswordMain />);
    
    const submitButton = screen.getByRole('button', { name: /Enviar enlace de recuperación/i });

    // Estado inicial
    expect(submitButton).toHaveStyle({ opacity: '1' });
    expect(submitButton).toHaveStyle({ cursor: 'pointer' });

    await userEvent.click(submitButton);

    // Estado de carga
    await waitFor(() => {
      expect(submitButton).toHaveStyle({ opacity: '0.8' });
      expect(submitButton).toHaveStyle({ cursor: 'not-allowed' });
    });

    // Esperar a que termine
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    }, { timeout: 3000 });
  });

  it('valida el email antes de verificar si está vacío', async () => {
    useForm.mockReturnValue([
      { email: 'invalid-email' },
      mockHandleInputChange,
      mockReset,
    ]);

    renderWithRouter(<ResetPasswordMain />);
    const submitButton = screen.getByRole('button', { name: /Enviar enlace de recuperación/i });

    await userEvent.click(submitButton);

    // Primero valida el formato, no que esté vacío
    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Falta el correo',
        })
      );
    });
  });

  it('incluye el mensaje de spam en el HTML de éxito', async () => {
    useForm.mockReturnValue([
      { email: 'test@example.com' },
      mockHandleInputChange,
      mockReset,
    ]);

    authService.sendResetPassword.mockResolvedValue({ ok: true });

    renderWithRouter(<ResetPasswordMain />);
    const submitButton = screen.getByRole('button', { name: /Enviar enlace de recuperación/i });

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('Si no lo ves en tu bandeja, revisa Spam o Promociones'),
        })
      );
    });
  });
});