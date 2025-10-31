import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TwoVerificationCodeMain from '../pages/two-verification/TwoVerificationMain';
import * as authService from '../services/authService';
import Swal from 'sweetalert2';
import { useNavigate, useLocation } from 'react-router-dom';

// Mock de useNavigate y useLocation
const mockNavigate = jest.fn();
const mockLocation = {
  search: '?email=test@example.com',
  pathname: '/two-verification',
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

// Mock de Swal
jest.mock('sweetalert2', () => ({
  fire: jest.fn(),
}));

// Mock de authService
jest.mock('../services/authService', () => ({
  loginStep1: jest.fn(),
  loginStep2: jest.fn(),
}));

// Mock de Breadcrumb
jest.mock('../components/Breadcrumb', () => () => <div>Breadcrumb Mock</div>);

// Mock de imágenes
jest.mock('../assets/img/contact/signin.jpg', () => 'signin-image.jpg');
jest.mock('../assets/img/class/phone.png', () => 'phone-icon.png');

describe('TwoVerificationCodeMain', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    Swal.fire.mockReset();
    Swal.fire.mockResolvedValue({});
    authService.loginStep1.mockReset();
    authService.loginStep2.mockReset();
    
    // Limpiar localStorage
    localStorage.clear();
    
    // Configurar location por defecto con email
    mockLocation.search = '?email=test@example.com';
  });

  it('renderiza correctamente el formulario de verificación', () => {
    render(<TwoVerificationCodeMain />);

    expect(screen.getByText('INGRESAR CÓDIGO')).toBeInTheDocument();
    expect(screen.getByText('Ingresa el código de 6 dígitos enviado a tu correo electrónico')).toBeInTheDocument();
    expect(screen.getByTestId('verify-button')).toHaveTextContent('Siguiente');
    expect(screen.getByText('Volver')).toBeInTheDocument();
    expect(screen.getByTestId('resend-button')).toBeInTheDocument();
    
    // Verificar que hay 6 inputs
    for (let i = 0; i < 6; i++) {
      expect(screen.getByTestId(`2fa-input-${i}`)).toBeInTheDocument();
    }
  });

  it('permite ingresar un dígito en cada input', async () => {
    render(<TwoVerificationCodeMain />);

    const input0 = screen.getByTestId('2fa-input-0');
    const input1 = screen.getByTestId('2fa-input-1');

    await userEvent.type(input0, '1');
    expect(input0).toHaveValue('1');

    await userEvent.type(input1, '2');
    expect(input1).toHaveValue('2');
  });

  it('avanza automáticamente al siguiente input al ingresar un dígito', async () => {
    render(<TwoVerificationCodeMain />);

    const input0 = screen.getByTestId('2fa-input-0');
    const input1 = screen.getByTestId('2fa-input-1');

    await userEvent.type(input0, '1');
    
    // El focus debería moverse automáticamente al siguiente input
    await waitFor(() => {
      expect(input1).toHaveFocus();
    });
  });

  it('retrocede al input anterior con Backspace', async () => {
    render(<TwoVerificationCodeMain />);

    const input0 = screen.getByTestId('2fa-input-0');
    const input1 = screen.getByTestId('2fa-input-1');

    // Llenar primer input y mover al segundo
    await userEvent.type(input0, '1');
    await userEvent.type(input1, '2');
    
    // Borrar el segundo input
    await userEvent.clear(input1);
    
    // Presionar Backspace en input vacío debería retroceder
    await userEvent.type(input1, '{Backspace}');
    
    await waitFor(() => {
      expect(input0).toHaveFocus();
    });
  });

  it('solo acepta dígitos numéricos', async () => {
    render(<TwoVerificationCodeMain />);

    const input0 = screen.getByTestId('2fa-input-0');

    await userEvent.type(input0, 'a');
    expect(input0).toHaveValue('');

    await userEvent.type(input0, '5');
    expect(input0).toHaveValue('5');
  });

  it('muestra error si el código está incompleto', async () => {
    render(<TwoVerificationCodeMain />);

    const verifyButton = screen.getByTestId('verify-button');
    
    // Llenar solo 3 dígitos
    await userEvent.type(screen.getByTestId('2fa-input-0'), '1');
    await userEvent.type(screen.getByTestId('2fa-input-1'), '2');
    await userEvent.type(screen.getByTestId('2fa-input-2'), '3');

    await userEvent.click(verifyButton);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'error',
          title: 'Código incompleto',
          text: 'Por favor ingresa los 6 dígitos.',
        })
      );
    });

    expect(authService.loginStep2).not.toHaveBeenCalled();
  });

  it('muestra error si no hay email en la query', async () => {
    // Configurar location sin email
    mockLocation.search = '';
    
    render(<TwoVerificationCodeMain />);

    const verifyButton = screen.getByTestId('verify-button');
    
    // Llenar código completo
    for (let i = 0; i < 6; i++) {
      await userEvent.type(screen.getByTestId(`2fa-input-${i}`), `${i + 1}`);
    }

    await userEvent.click(verifyButton);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'warning',
          title: 'Sesión incompleta',
          text: 'Vuelve a iniciar sesión para obtener un código.',
        })
      );
    });

    expect(authService.loginStep2).not.toHaveBeenCalled();
  });

  it('verifica código exitosamente y redirige a /paciente para rol paciente', async () => {
    authService.loginStep2.mockResolvedValue({
      ok: true,
      rol: 'paciente',
      nombre: 'Juan Pérez',
      email: 'test@example.com',
    });

    render(<TwoVerificationCodeMain />);

    // Llenar código completo
    for (let i = 0; i < 6; i++) {
      await userEvent.type(screen.getByTestId(`2fa-input-${i}`), `${i + 1}`);
    }

    const verifyButton = screen.getByTestId('verify-button');
    await userEvent.click(verifyButton);

    await waitFor(() => {
      expect(authService.loginStep2).toHaveBeenCalledWith('test@example.com', '123456');
    });

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'success',
          title: 'Código verificado',
          text: 'Tu identidad ha sido confirmada.',
          timer: 1400,
          showConfirmButton: false,
        })
      );
    });

    // Verificar localStorage
    const userData = JSON.parse(localStorage.getItem('nb-user'));
    expect(userData).toEqual({
      email: 'test@example.com',
      rol: 'paciente',
      nombre: 'Juan Pérez',
    });

    expect(mockNavigate).toHaveBeenCalledWith('/paciente');
  });

  it('verifica código exitosamente y redirige a /medico para rol medico', async () => {
    authService.loginStep2.mockResolvedValue({
      ok: true,
      rol: 'medico',
      nombre: 'Dra. María García',
      email: 'test@example.com',
    });

    render(<TwoVerificationCodeMain />);

    // Llenar código completo
    for (let i = 0; i < 6; i++) {
      await userEvent.type(screen.getByTestId(`2fa-input-${i}`), `${i + 1}`);
    }

    const verifyButton = screen.getByTestId('verify-button');
    await userEvent.click(verifyButton);

    await waitFor(() => {
      expect(authService.loginStep2).toHaveBeenCalledWith('test@example.com', '123456');
    });

    // Verificar localStorage
    const userData = JSON.parse(localStorage.getItem('nb-user'));
    expect(userData).toEqual({
      email: 'test@example.com',
      rol: 'medico',
      nombre: 'Dra. María García',
    });

    expect(mockNavigate).toHaveBeenCalledWith('/medico');
  });

  it('redirige a / para roles no reconocidos', async () => {
    authService.loginStep2.mockResolvedValue({
      ok: true,
      rol: 'admin',
      nombre: 'Admin User',
      email: 'test@example.com',
    });

    render(<TwoVerificationCodeMain />);

    // Llenar código completo
    for (let i = 0; i < 6; i++) {
      await userEvent.type(screen.getByTestId(`2fa-input-${i}`), `${i + 1}`);
    }

    const verifyButton = screen.getByTestId('verify-button');
    await userEvent.click(verifyButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('muestra error cuando el código es inválido', async () => {
    authService.loginStep2.mockRejectedValue(new Error('Código inválido o expirado'));

    render(<TwoVerificationCodeMain />);

    // Llenar código completo
    for (let i = 0; i < 6; i++) {
      await userEvent.type(screen.getByTestId(`2fa-input-${i}`), `${i + 1}`);
    }

    const verifyButton = screen.getByTestId('verify-button');
    await userEvent.click(verifyButton);

    await waitFor(() => {
      expect(authService.loginStep2).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'error',
          title: 'Error al verificar',
          text: 'Código inválido o expirado',
        })
      );
    });

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(localStorage.getItem('nb-user')).toBeNull();
  });

  it('desactiva el botón durante la verificación', async () => {
    authService.loginStep2.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        rol: 'paciente',
        nombre: 'Test',
        email: 'test@example.com',
      }), 100))
    );

    render(<TwoVerificationCodeMain />);

    // Llenar código completo
    for (let i = 0; i < 6; i++) {
      await userEvent.type(screen.getByTestId(`2fa-input-${i}`), `${i + 1}`);
    }

    const verifyButton = screen.getByTestId('verify-button');
    await userEvent.click(verifyButton);

    // Verificar estado de carga
    await waitFor(() => {
      expect(verifyButton).toBeDisabled();
      expect(verifyButton).toHaveTextContent('Verificando...');
    });

    // Esperar a que termine
    await waitFor(() => {
      expect(verifyButton).not.toBeDisabled();
    }, { timeout: 3000 });
  });

  it('maneja el botón de volver correctamente', async () => {
    render(<TwoVerificationCodeMain />);

    const backButton = screen.getByText('Volver');
    await userEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/signin');
  });

  it('intenta reenviar código con email válido', async () => {
    authService.loginStep1.mockResolvedValue({ ok: true });

    render(<TwoVerificationCodeMain />);

    const resendButton = screen.getByTestId('resend-button');
    await userEvent.click(resendButton);

    await waitFor(() => {
      expect(authService.loginStep1).toHaveBeenCalledWith('test@example.com', '___dummy___');
    });

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'info',
          title: 'Código reenviado',
          text: 'Te hemos enviado un nuevo código de verificación.',
        })
      );
    });
  });

  it('muestra error al reenviar sin email', async () => {
    mockLocation.search = '';
    
    render(<TwoVerificationCodeMain />);

    const resendButton = screen.getByTestId('resend-button');
    await userEvent.click(resendButton);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'warning',
          title: 'Sin correo',
          text: 'Vuelve a iniciar sesión para reenviar el código.',
        })
      );
    });

    expect(authService.loginStep1).not.toHaveBeenCalled();
  });

  it('muestra error si falla el reenvío de código', async () => {
    authService.loginStep1.mockRejectedValue(new Error('Error al reenviar'));

    render(<TwoVerificationCodeMain />);

    const resendButton = screen.getByTestId('resend-button');
    await userEvent.click(resendButton);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'error',
          title: 'No se pudo reenviar',
          text: 'Intenta otra vez desde el inicio de sesión.',
        })
      );
    });
  });

  it('previene el comportamiento por defecto del link al reenviar', async () => {
    authService.loginStep1.mockResolvedValue({ ok: true });

    render(<TwoVerificationCodeMain />);

    const resendButton = screen.getByTestId('resend-button');
    
    // Simular click con preventDefault
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');
    
    resendButton.dispatchEvent(clickEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('no acepta más de un dígito por input', async () => {
    render(<TwoVerificationCodeMain />);

    const input0 = screen.getByTestId('2fa-input-0');

    await userEvent.type(input0, '123');
    
    // Solo debería quedar el primer dígito
    expect(input0).toHaveValue('1');
  });

  it('mantiene el estado del botón habilitado inicialmente', () => {
    render(<TwoVerificationCodeMain />);

    const verifyButton = screen.getByTestId('verify-button');
    
    expect(verifyButton).not.toBeDisabled();
    expect(verifyButton).toHaveTextContent('Siguiente');
  });
});