import Swal from 'sweetalert2'
import { mainApi } from '../../axios'
import { setSociedad, startLoadingSociedad } from './sociedadSlice'

export const getSociedad = () => {
  return async(dispatch) => {
    console.log("Sociedad")
    dispatch(startLoadingSociedad())
    await mainApi.get('/api/sociedad')
      .then(resp => {
        console.log(resp.data)
        dispatch(setSociedad(resp.data.sociedades[0]))
      })
      .catch(err => {
        Swal.fire({
          icon: "error",
          title: "Ooops...",
          text: "Sociedades no encontradas"
        })
      })
  }
}

export const createSociedad = async(sociedad, modal) => {
  console.log("Arrives")
    await mainApi.post('/api/sociedad',sociedad, {
      headers: {
        'Content-type': 'application/json',
        'x-token': localStorage.getItem("token-ptin")
      }
    })
    .then(resp => {
      Swal.fire('Éxito', 'Sociedad registrada exitosamente.', 'success');
    })
    .catch(err => {
      Swal.fire({
        icon: "error",
        title: "Ooops...",
        text: "Error al registrar la sociedad"
      })
    })
}

export const actualizarSociedad = async (sociedad, modal) => {
  try {
    // Realiza la petición PUT a la API
    const response = await mainApi.put(`/api/sociedad/${sociedad._id}`, sociedad, {
      headers: {
        'Content-type': 'application/json',
        'x-token': localStorage.getItem("token-ptin")
      }
    });

    // Verifica si la respuesta es exitosa
    if (response.status === 200) {
      Swal.fire('Éxito', 'Sociedad actualizada exitosamente.', 'success');
      // Si necesitas cerrar el modal, puedes hacerlo aquí
      if (modal) {
        modal.close(); // Suponiendo que `modal` es un objeto de un modal que puedes cerrar
      }
    } else {
      throw new Error('Error en la respuesta del servidor');
    }
  } catch (err) {
    console.error('Error al actualizar la sociedad:', err);
    Swal.fire({
      icon: "error",
      title: "Ooops...",
      text: err.message || "Error al actualizar la sociedad"
    });
  }
};