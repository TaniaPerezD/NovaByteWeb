describe('Flujo de Autenticación Completo', () => {
  beforeEach(() => {
    cy.visit('/');
    // Limpiar datos de prueba
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  describe('Landing Page', () => {
    it('debe mostrar la página de inicio correctamente', () => {
      cy.get('[data-testid="home-header"]').should('be.visible');
      cy.get('[data-testid="login-button"]').should('be.visible');
    });

    it('navega a login al hacer click en el botón', () => {
      cy.get('.muneco-overlay .close-button').click();
      cy.get('[data-testid="login-button"]').click();
      cy.url().should('include', '/signin');
    });
  });

  describe('Login', () => {
    beforeEach(() => {
      cy.visit('/signin');
    });

    it('debe iniciar sesión exitosamente y redirigir a 2FA', () => {
        cy.get('[data-testid="email-input"]').type('latinoignas@gmail.com');
        cy.get('[data-testid="password-input"]').type('12345678@2');

        cy.get('[data-testid="login-button"]').should('not.be.disabled').and('contain', 'Ingresar').click();

        cy.get('[data-testid="login-button"]').should('be.disabled').and('contain', 'Enviando...');

        cy.get('.swal2-container', { timeout: 10000 }).should('be.visible');
        cy.get('.swal2-title').should('contain.text', 'Código enviado');

        cy.get('.swal2-confirm').click();

        cy.url().should('include', '/two-verification');
    });

    it('muestra error con credenciales incorrectas', () => {
        cy.get('[data-testid="email-input"]').type('test@test.com');
        cy.get('[data-testid="password-input"]').type('wrongpassword');
        cy.get('[data-testid="login-button"]').should('not.be.disabled').and('contain', 'Ingresar').click();

        cy.get('.swal2-container', { timeout: 10000 }).should('be.visible');
        cy.get('.swal2-title').should('contain.text', 'No se pudo iniciar sesión');

        cy.get('.swal2-html-container').should('contain.text', 'Credenciales inválidas (no existe perfil)');
        cy.get('.swal2-confirm').click();
    });

    it('Todos los campos vacíos', () => {
        cy.get('[data-testid="login-button"]').should('not.be.disabled').and('contain', 'Ingresar').click();

        cy.get('.swal2-container', { timeout: 10000 }).should('be.visible');
        cy.get('.swal2-title').should('contain.text', 'Ooops...');

        cy.get('.swal2-html-container').should('contain.text', 'Correo electrónico inválido');
        cy.get('.swal2-confirm').click();
    });

    it('Contraseña vacía', () => {
        cy.get('[data-testid="email-input"]').type('test@test.com');
        cy.get('[data-testid="login-button"]').should('not.be.disabled').and('contain', 'Ingresar').click();

        cy.get('.swal2-container', { timeout: 10000 }).should('be.visible');
        cy.get('.swal2-title').should('contain.text', 'Ooops...');
        cy.get('.swal2-html-container').should('contain.text', 'La contraseña no debe estar vacía');
        cy.get('.swal2-confirm').click();
    });

  });

  //CONTINUAR LUEGO CRJMRD

    describe('Verificación 2FA', () => {
        beforeEach(() => {
            cy.login('medico@test.com', 'Password123!');
            cy.url().should('include', '/two-verification');
        });

        it('verifica código correctamente y redirige al dashboard', () => {
            // Llenar código 123456
            cy.get('[data-testid="2fa-input-0"]').type('1');
            cy.get('[data-testid="2fa-input-1"]').type('2');
            cy.get('[data-testid="2fa-input-2"]').type('3');
            cy.get('[data-testid="2fa-input-3"]').type('4');
            cy.get('[data-testid="2fa-input-4"]').type('5');
            cy.get('[data-testid="2fa-input-5"]').type('6');

            cy.get('[data-testid="verify-button"]').click();

            // SweetAlert aparece
            cy.get('.swal2-popup').should('be.visible');
            cy.get('.swal2-confirm').click();

            cy.url().should('include', '/medico');
        });

        it('muestra error con código incorrecto', () => {
            cy.get('[data-testid="2fa-input-0"]').type('0');
            cy.get('[data-testid="2fa-input-1"]').type('0');
            cy.get('[data-testid="2fa-input-2"]').type('0');
            cy.get('[data-testid="2fa-input-3"]').type('0');
            cy.get('[data-testid="2fa-input-4"]').type('0');
            cy.get('[data-testid="2fa-input-5"]').type('0');

            cy.get('[data-testid="verify-button"]').click();

            cy.get('.swal2-popup').should('contain', 'Error al verificar');
            cy.get('.swal2-confirm').click();
        });

        it('permite reenviar código después del tiempo de espera', () => {
            cy.get('[data-testid="resend-button"]').should('not.have.attr', 'disabled');

            cy.get('[data-testid="resend-button"]').click();

            cy.get('.swal2-popup').should('contain', 'Código reenviado');
            cy.get('.swal2-confirm').click();
        });
    });

  describe('Recuperación de Contraseña', () => {
    beforeEach(() => {
      cy.visit('/forgot-password');
    });

    it('envía email de recuperación exitosamente', () => {
      cy.get('[data-testid="email-input"]').type('test@test.com');
      cy.get('[data-testid="submit-button"]').click();

      cy.get('[data-testid="success-message"]')
        .should('contain', 'Hemos enviado un enlace');
    });

    it('muestra error con email no registrado', () => {
      cy.get('[data-testid="email-input"]').type('noexiste@test.com');
      cy.get('[data-testid="submit-button"]').click();

      cy.get('[data-testid="error-message"]')
        .should('contain', 'No se encontró una cuenta');
    });
  });

  describe('Restablecer Contraseña', () => {
    beforeEach(() => {
      // Simula que llegó desde email con token válido
      cy.visit('/reset-password?token=valid_token_123');
    });

    it('actualiza contraseña exitosamente', () => {
      cy.get('[data-testid="password-input"]').type('NewPassword123!');
      cy.get('[data-testid="confirm-password-input"]').type('NewPassword123!');
      cy.get('[data-testid="submit-button"]').click();

      cy.get('[data-testid="success-message"]')
        .should('contain', 'Contraseña actualizada');
      cy.url().should('include', '/login');
    });

    it('valida fortaleza de contraseña', () => {
      cy.get('[data-testid="password-input"]').type('weak');
      cy.get('[data-testid="password-strength"]')
        .should('contain', 'Débil');

      cy.get('[data-testid="password-input"]').clear().type('Password1');
      cy.get('[data-testid="password-strength"]')
        .should('contain', 'Media');

      cy.get('[data-testid="password-input"]').clear().type('Password123!');
      cy.get('[data-testid="password-strength"]')
        .should('contain', 'Fuerte');
    });

    it('valida que las contraseñas coincidan', () => {
      cy.get('[data-testid="password-input"]').type('Password123!');
      cy.get('[data-testid="confirm-password-input"]').type('Password456!');
      cy.get('[data-testid="submit-button"]').click();

      cy.get('[data-testid="error-message"]')
        .should('contain', 'Las contraseñas no coinciden');
    });

    it('muestra error con token expirado', () => {
      cy.visit('/reset-password?token=expired_token');
      
      cy.get('[data-testid="password-input"]').type('NewPassword123!');
      cy.get('[data-testid="confirm-password-input"]').type('NewPassword123!');
      cy.get('[data-testid="submit-button"]').click();

      cy.get('[data-testid="error-message"]')
        .should('contain', 'Enlace expirado');
    });
  });

  describe('Dashboards por Rol', () => {
    it('médico accede a su dashboard correctamente', () => {
      cy.loginAndVerify2FA('medico@test.com', 'Password123!', '123456');
      
      cy.url().should('include', '/dashboard/medico');
      cy.get('[data-testid="welcome-message"]')
        .should('contain', 'Bienvenido, Dr.');
      cy.get('[data-testid="patients-list"]').should('be.visible');
      cy.get('[data-testid="appointments-section"]').should('be.visible');
    });

    it('paciente accede a su dashboard correctamente', () => {
      cy.loginAndVerify2FA('paciente@test.com', 'Password123!', '123456');
      
      cy.url().should('include', '/dashboard/paciente');
      cy.get('[data-testid="welcome-message"]')
        .should('contain', 'Bienvenido');
      cy.get('[data-testid="my-appointments"]').should('be.visible');
      cy.get('[data-testid="my-prescriptions"]').should('be.visible');
    });

    it('impide acceso a dashboard de otro rol', () => {
      cy.loginAndVerify2FA('paciente@test.com', 'Password123!', '123456');
      
      // Intenta acceder a dashboard de médico
      cy.visit('/dashboard/medico');
      
      cy.url().should('include', '/unauthorized');
      cy.get('[data-testid="error-message"]')
        .should('contain', 'No tienes permisos');
    });
  });

});