import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PaginaPublica from '../../components/PaginaPublica';
import Breadcrumb from '../../components/Breadcrumb';
import { catalogoPublico } from '../../services/privacidadService';

// Aviso de privacidad para pacientes (NB-POL-P6-04, Anexo A) con los cuatro consentimientos vigentes.
const Privacidad = () => {
  const [consentimientos, setConsentimientos] = useState([]);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    let activo = true;
    catalogoPublico()
      .then((d) => activo && setConsentimientos(d || []))
      .catch(() => activo && setFallo(true));
    return () => { activo = false; };
  }, []);

  const caja = { background: 'white', border: '1px solid #f1d5d5', borderRadius: '10px', padding: '18px 22px', marginBottom: '14px' };

  return (
    <PaginaPublica>
      <main>
        <Breadcrumb title="Aviso de privacidad" />
        <div className="it-signup-area pt-120 pb-120" style={{ background: '#FFF5F5' }}>
          <div className="container" style={{ maxWidth: '900px' }}>
            <p style={{ fontSize: '19px', lineHeight: 1.7 }}>
              En NovaByte cuidamos sus datos. Usamos sus datos de salud solo para atenderla. Usted decide si nos envía imágenes de
              autoexploración y si permite que una herramienta de inteligencia artificial apoye a su médica o médico; la herramienta no
              reemplaza su criterio. Puede pedir ver, corregir o retirar sus datos en el consultorio o en la app. Si ocurre un problema
              que afecte sus datos, se lo informaremos en un máximo de 72 horas.
            </p>

            <h4 style={{ fontSize: '28px', margin: '32px 0 12px' }}>Qué datos guardamos</h4>
            <div style={caja}>
              <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.8 }}>
                <li>Identificación y contacto: nombre, correo y fecha de nacimiento.</li>
                <li>Expediente clínico y resultados, imágenes de estudios de mama y fotografías de autoexploración (si usted las envía).</li>
                <li>Datos de uso de la app, como sus ingresos, para proteger su cuenta.</li>
                <li>No guardamos huellas ni imágenes de su rostro: la verificación biométrica la hace su teléfono.</li>
              </ul>
            </div>

            <h4 style={{ fontSize: '28px', margin: '32px 0 12px' }}>Sus consentimientos</h4>
            {fallo && <p role="alert">No se pudo cargar el detalle de los consentimientos. Intente de nuevo en unos minutos.</p>}
            {consentimientos.map((c) => (
              <div key={c.codigo} style={caja}>
                <strong>
                  {c.codigo}. {c.titulo}
                </strong>{' '}
                <span style={{ color: '#4E5865' }}>({c.obligatorio ? 'obligatorio para usar la app' : 'opcional'})</span>
                <ul style={{ margin: '8px 0 0', paddingLeft: '20px', lineHeight: 1.7 }}>
                  <li><b>Qué autoriza:</b> {c.que_autoriza}</li>
                  <li><b>Qué datos se usan y para qué:</b> {c.datos_y_uso}</li>
                  <li><b>Quién los ve:</b> {c.quien_ve}</li>
                  <li><b>Cuánto tiempo se guardan:</b> {c.conservacion}</li>
                  <li><b>Si lo retira:</b> {c.si_se_retira}</li>
                </ul>
              </div>
            ))}

            <h4 style={{ fontSize: '28px', margin: '32px 0 12px' }}>Sus derechos</h4>
            <div style={caja}>
              <p style={{ margin: 0, lineHeight: 1.7 }}>
                Puede pedir ver sus datos, corregirlos, retirar un consentimiento o solicitar su eliminación desde «Mi privacidad» en la
                app, o en el consultorio. Respondemos en un máximo de 10 días hábiles. El expediente clínico se conserva por los plazos
                que fija la norma (mínimo 10 años); los datos que no estén sujetos a conservación se eliminan o se anonimizan.
              </p>
            </div>
            <p style={{ color: '#4E5865' }}>
              Lea también la <Link to="/seguridad">guía de seguridad</Link>.
            </p>
          </div>
        </div>
      </main>
    </PaginaPublica>
  );
};

export default Privacidad;
