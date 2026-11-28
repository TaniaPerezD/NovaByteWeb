// Direcciones de los servicios externos. En producción se definen como variables de entorno
// (REACT_APP_REPORTES_URL, REACT_APP_MODELO_URL); en local usan los puertos de desarrollo.
const quitarBarra = (u) => u.replace(/\/+$/, '');

export const REPORTES_URL = quitarBarra(process.env.REACT_APP_REPORTES_URL || 'http://localhost:4001');
export const GRAPHQL_URL = process.env.REACT_APP_GRAPHQL_URL || `${REPORTES_URL}/graphql`;
export const MODELO_URL = quitarBarra(process.env.REACT_APP_MODELO_URL || 'http://localhost:7860');
