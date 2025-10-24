import Swal from 'sweetalert2'
import { mainApi } from '../../axios'
import { setNoticia, setNoticiaId, startLoadingNoticia } from './noticiasSlice'

export const getNews = (limit, page) => {
  return async(dispatch) => {
    dispatch(startLoadingNoticia)
    await mainApi.get('/api/news',
      {
        headers: {
          'limit': limit,
          'page': page
        }
      }
    )
      .then(resp => {
        console.log("Fetch Noticias: " + resp.data)
        localStorage.setItem("news-array", resp.data)
        dispatch(setNoticia(resp.data))
      })
      .catch(err => {
        Swal.fire({
          icon: "error",
          title: "Ooops...",
          text: "Noticias no encontradas"
        })
      })
  }
}

export const getNewById = (id) => {
  return async(dispatch) => {
    dispatch(startLoadingNoticia)
    await mainApi.get(`/api/news/${id}`)
      .then(resp => {
        console.log("Fetch Noticia: " + resp.data.noticia.title)
        dispatch(setNoticiaId(resp.data))
      })
      .catch(err => {
        Swal.fire({
          icon: "error",
          title: "Ooops...",
          text: "Noticia no encontradas"
        })
      })
  }
}

export const createNews = async (noticia, modal) => {
  console.log("Arrives");  // Asegúrate de que la función está siendo llamada
  try {
    const resp = await mainApi.post('/api/news', noticia, {
      headers: {
        'Content-type': 'application/json',
        'x-token': localStorage.getItem("token-ptin"),
      }
    });
    // Log de la respuesta para ver qué devuelve el backend
    console.log("Respuesta del servidor:", resp);

    Swal.fire('Éxito', 'Noticia registrada exitosamente.', 'success');
  } catch (err) {
    // Log del error para ver qué está fallando
    console.error("Error al crear la noticia:", err.response || err);

    Swal.fire({
      icon: "error",
      title: "Ooops...",
      text: "Error al crear la noticia",
    });
  }
};

export const actualizarNoticia = async (noticia, modal) => {
  try {
    // Realiza la petición PUT a la API
    const response = await mainApi.put(`/api/news/${noticia._id}`, noticia, {
      headers: {
        'Content-type': 'application/json',
        'x-token': localStorage.getItem("token-ptin")
      }
    });

    // Verifica si la respuesta es exitosa
    if (response.status === 200) {
      Swal.fire('Éxito', 'Noticia actualizada exitosamente.', 'success');
      // Si necesitas cerrar el modal, puedes hacerlo aquí
      if (modal) {
        modal.close(); // Suponiendo que `modal` es un objeto de un modal que puedes cerrar
      }
    } else {
      throw new Error('Error en la respuesta del servidor');
    }
  } catch (err) {
    console.error('Error al actualizar noticia:', err);
    Swal.fire({
      icon: "error",
      title: "Ooops...",
      text: err.message || "Error al actualizar la noticia"
    });
  }
};