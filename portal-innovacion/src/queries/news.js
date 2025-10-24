import { mainApi } from '../axios'

// Función crearNoticias que ahora recibe el token
export const crearNoticias = async (title, description, start, token) => {
    try {
      const response = await mainApi.post('/api/news', {
        title,
        description,
        start
      }, {
        headers: {
          'Content-type': 'application/json',
          'x-token': token  // Usar el token en las cabeceras
        }
      });
      return response;  // Devuelve la respuesta de la API
    } catch (error) {
      console.error('Error al crear noticia:', error);
      throw error;  // Propagar el error para que el componente lo maneje
    }
  };
  

