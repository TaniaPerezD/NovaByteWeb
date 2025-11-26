import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NewPasswordMain from '../pages/new-password/NewPasswordMain';
import Swal from 'sweetalert2';

// Mock de react-router
const mockNavigate = jest.fn();
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    search: '?token=test-token-123&email=test@example.com',
  }),
}));

// Mock de Breadcrumb
jest.mock('../components/Breadcrumb', () => {
  return function MockBreadcrumb() {
    return <div data-testid="breadcrumb">Breadcrumb</div>;
  };
});

// Mock de sweetalert2
jest.mock('sweetalert2', () => ({
  fire: jest.fn(() => Promise.resolve({ isConfirmed: true })),
}));

// Mock de fetch
global.fetch = jest.fn();

jest.mock('../assets/img/contact/signin.jpg', () => 'signin.jpg');

describe('NewPasswordMain Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <NewPasswordMain />
      </BrowserRouter>
    );
  };

  describe('Renderizado inicial', () => {
    test('debe renderizar el componente correctamente', () => {
      renderComponent();
      
      expect(screen.getByText('NUEVA CONTRASEÑA')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Nueva contraseña')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirmar contraseña')).toBeInTheDocument();
      expect(screen.getByText('Guardar nueva contraseña')).toBeInTheDocument();
    });

    test('debe mostrar el email del query parameter', () => {
      renderComponent();
      
      expect(screen.getByText('Email:')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    test('debe mostrar "—" cuando no hay email', () => {
      jest.spyOn(require('react-router'), 'useLocation').mockReturnValue({
        search: '?token=test-token-123',
      });

      renderComponent();
      
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    test('debe renderizar el breadcrumb', () => {
      renderComponent();
      
      expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
    });

    test('debe tener los campos de contraseña de tipo password inicialmente', () => {
      renderComponent();
      
      const passwordInputs = screen.getAllByPlaceholderText(/contraseña/i);
      passwordInputs.forEach(input => {
        expect(input).toHaveAttribute('type', 'password');
      });
    });
  });

  describe('Funcionalidad de mostrar/ocultar contraseña', () => {
    test('debe cambiar el tipo de input al hacer clic en el icono del ojo', () => {
      renderComponent();
      
      const passwordInput = screen.getByPlaceholderText('Nueva contraseña');
      expect(passwordInput).toHaveAttribute('type', 'password');
      
      const eyeIcons = screen.getAllByRole('button', { hidden: true });
      fireEvent.click(eyeIcons[0]);
      
      expect(passwordInput).toHaveAttribute('type', 'text');
    });

    test('debe alternar entre mostrar y ocultar contraseña', () => {
      renderComponent();
      
      const passwordInput = screen.getByPlaceholderText('Nueva contraseña');
      const eyeIcons = screen.getAllByRole('button', { hidden: true });
      
      // Primera vez: oculta -> visible
      fireEvent.click(eyeIcons[0]);
      expect(passwordInput).toHaveAttribute('type', 'text');
      
      // Segunda vez: visible -> oculta
      fireEvent.click(eyeIcons[0]);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Validaciones del formulario', () => {
    test('debe mostrar error cuando no hay token', async () => {
      jest.spyOn(require('react-router'), 'useLocation').mockReturnValue({
        search: '',
      });

      renderComponent();
      
      const submitButton = screen.getByText('Guardar nueva contraseña');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(Swal.fire).toHaveBeenCalledWith({
          icon: 'error',
          title: 'Enlace inválido',
          text: 'El enlace de recuperación no es válido o ya expiró.',
          confirmButtonColor: '#E79796',
        });
      });
    });

    test('debe mostrar error cuando la contraseña es muy corta', async () => {
      renderComponent();
      
      const passwordInput = screen.getByPlaceholderText('Nueva contraseña');
      const confirmInput = screen.getByPlaceholderText('Confirmar contraseña');
      
      fireEvent.change(passwordInput, { target: { value: '1234' } });
      fireEvent.change(confirmInput, { target: { value: '1234' } });
      
      const submitButton = screen.getByText('Guardar nueva contraseña');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(Swal.fire).toHaveBeenCalledWith({
          icon: 'error',
          title: 'Contraseña muy corta',
          text: 'La contraseña debe tener mínimo 8 caracteres.',
          confirmButtonColor: '#E79796',
        });
      });
    });

    test('debe mostrar error cuando las contraseñas no coinciden', async () => {
      renderComponent();
      
      const passwordInput = screen.getByPlaceholderText('Nueva contraseña');
      const confirmInput = screen.getByPlaceholderText('Confirmar contraseña');
      
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmInput, { target: { value: 'password456' } });
      
      const submitButton = screen.getByText('Guardar nueva contraseña');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(Swal.fire).toHaveBeenCalledWith({
          icon: 'error',
          title: 'Las contraseñas no coinciden',
          text: 'Vuelve a escribir la contraseña.',
          confirmButtonColor: '#E79796',
        });
      });
    });
  });

  describe('Submit del formulario', () => {
    test('debe llamar a la API con los datos correctos', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      });

      renderComponent();
      
      const passwordInput = screen.getByPlaceholderText('Nueva contraseña');
      const confirmInput = screen.getByPlaceholderText('Confirmar contraseña');
      
      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
      fireEvent.change(confirmInput, { target: { value: 'newpassword123' } });
      
      const submitButton = screen.getByText('Guardar nueva contraseña');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://nvfhmlfbocdiczpxgidu.supabase.co/functions/v1/reset-password',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: expect.any(String),
              Authorization: expect.any(String),
            },
            body: JSON.stringify({
              token: 'test-token-123',
              email: 'test@example.com',
              password: 'newpassword123',
            }),
          })
        );
      });
    });

    test('debe mostrar mensaje de éxito y redirigir al login', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      });

      Swal.fire.mockResolvedValueOnce({ isConfirmed: true });

      renderComponent();
      
      const passwordInput = screen.getByPlaceholderText('Nueva contraseña');
      const confirmInput = screen.getByPlaceholderText('Confirmar contraseña');
      
      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
      fireEvent.change(confirmInput, { target: { value: 'newpassword123' } });
      
      const submitButton = screen.getByText('Guardar nueva contraseña');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(Swal.fire).toHaveBeenCalledWith({
          icon: 'success',
          title: 'Contraseña actualizada',
          text: 'Ya puedes iniciar sesión con tu nueva contraseña.',
          confirmButtonColor: '#E79796',
        });
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/signin');
      });
    });

    test('debe mostrar mensaje de error cuando la API falla', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ ok: false, message: 'Token inválido' }),
      });

      renderComponent();
      
      const passwordInput = screen.getByPlaceholderText('Nueva contraseña');
      const confirmInput = screen.getByPlaceholderText('Confirmar contraseña');
      
      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
      fireEvent.change(confirmInput, { target: { value: 'newpassword123' } });
      
      const submitButton = screen.getByText('Guardar nueva contraseña');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(Swal.fire).toHaveBeenCalledWith({
          icon: 'error',
          title: 'No se pudo actualizar',
          text: 'Token inválido',
          confirmButtonColor: '#E79796',
        });
      });
    });

    test('debe manejar errores de red', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      renderComponent();
      
      const passwordInput = screen.getByPlaceholderText('Nueva contraseña');
      const confirmInput = screen.getByPlaceholderText('Confirmar contraseña');
      
      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
      fireEvent.change(confirmInput, { target: { value: 'newpassword123' } });
      
      const submitButton = screen.getByText('Guardar nueva contraseña');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(Swal.fire).toHaveBeenCalledWith({
          icon: 'error',
          title: 'No se pudo actualizar',
          text: 'No pudimos contactar al servidor. Intenta otra vez.',
          confirmButtonColor: '#E79796',
        });
      });
    });

    test('debe deshabilitar el botón durante el loading', async () => {
      global.fetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ ok: true }),
        }), 100))
      );

      renderComponent();
      
      const passwordInput = screen.getByPlaceholderText('Nueva contraseña');
      const confirmInput = screen.getByPlaceholderText('Confirmar contraseña');
      
      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
      fireEvent.change(confirmInput, { target: { value: 'newpassword123' } });
      
      const submitButton = screen.getByText('Guardar nueva contraseña');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Guardando...')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Botón de volver', () => {
    test('debe redirigir a /signin al hacer clic en "Volver al inicio de sesión"', () => {
      renderComponent();
      
      const backButton = screen.getByText(/Volver al inicio de sesión/i);
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/signin');
    });
  });

  describe('Estados del input', () => {
    test('debe actualizar el valor de la contraseña al escribir', () => {
      renderComponent();
      
      const passwordInput = screen.getByPlaceholderText('Nueva contraseña');
      fireEvent.change(passwordInput, { target: { value: 'test123456' } });

      expect(passwordInput.value).toBe('test123456');
    });

    test('debe actualizar el valor de confirmar contraseña al escribir', () => {
      renderComponent();
      
      const confirmInput = screen.getByPlaceholderText('Confirmar contraseña');
      fireEvent.change(confirmInput, { target: { value: 'test123456' } });

      expect(confirmInput.value).toBe('test123456');
    });
  });
});