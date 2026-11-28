import React from 'react';
import { Link } from 'react-router-dom';
import PaginaPublica from '../../components/PaginaPublica';
import Breadcrumb from '../../components/Breadcrumb';

// Guía de seguridad para pacientes (NB-POL-P6-07): frases cortas, sin términos técnicos, una página.
const PUNTOS = [
  ['Cuida tu clave', 'Usa una clave que solo tú conozcas: mínimo 8 caracteres, con una mayúscula y un número. No la compartas con nadie. El consultorio nunca te la pedirá.'],
  ['Tu código de verificación es personal', 'Cada vez que entras te enviamos un código por correo. No lo compartas ni lo digas por teléfono.'],
  ['Si pierdes tu teléfono o crees que alguien usa tu cuenta', 'Entra a «Mi actividad» y presiona «Bloquear mi cuenta», o llama al consultorio. Se cierran todas las sesiones al instante.'],
  ['Si te equivocas tres veces', 'La cuenta se bloquea sola para protegerte. Te enviamos un enlace al correo para desbloquearla: dura 30 minutos y se usa una sola vez.'],
  ['Mira tu actividad', 'En «Mi actividad» ves tus sesiones y tus ingresos recientes, y puedes cerrar la sesión de otros dispositivos.'],
  ['Tu sesión se cierra sola', 'Si pasan 10 minutos sin que uses la app, la sesión se cierra para cuidar tus datos.'],
  ['Tus datos son tuyos', 'Solo los ve quien te atiende. En «Mi privacidad» puedes ver, corregir o retirar tus datos y cambiar tus consentimientos.'],
  ['Si hay un problema con tus datos', 'Te lo informamos en un máximo de 72 horas: qué datos fueron afectados, qué hicimos y qué puedes hacer.'],
];

const Seguridad = () => (
  <PaginaPublica>
    <main>
      <Breadcrumb title="Guía de seguridad" />
      <div className="it-signup-area pt-120 pb-120" style={{ background: '#FFF5F5' }}>
        <div className="container" style={{ maxWidth: '860px' }}>
          <p style={{ color: '#4E5865', fontSize: '18px' }}>
            Estas son las medidas que te cuidan a ti y a tus datos en NovaByte. Versión 1.0.
          </p>
          <ol style={{ paddingLeft: '22px', margin: '22px 0' }}>
            {PUNTOS.map(([titulo, texto]) => (
              <li key={titulo} style={{ marginBottom: '16px', lineHeight: 1.6 }}>
                <strong>{titulo}.</strong> {texto}
              </li>
            ))}
          </ol>
          <p style={{ color: '#4E5865' }}>
            ¿Dudas? Comunícate con el consultorio por los canales que figuran al pie de esta página. Consulta también el{' '}
            <Link to="/privacidad">aviso de privacidad</Link>.
          </p>
        </div>
      </div>
    </main>
  </PaginaPublica>
);

export default Seguridad;
