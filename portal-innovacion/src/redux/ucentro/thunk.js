import Swal from 'sweetalert2'
import { mainApi } from '../../axios'
import { setUcentro, startLoadingUcentro } from './ucentroSlice'

export const getUcentro = () => {
  return async(dispatch) => {
    dispatch(startLoadingUcentro())
    await mainApi.get('/api/ucentro')
      .then(resp => {
        console.log("Ucentro: " + resp.data.ucentro)
        dispatch(setUcentro(resp.data.ucentro))
      })
      .catch(err => {
        Swal.fire({
          icon: "error",
          title: "Ooops...",
          text: "Miembros del centro no encontrados"
        })
      })
  }
}

export const createUcentro = async(ucentro, modal) => {
  console.log("Arrives")
    await mainApi.post('/api/ucentro',ucentro, {
      headers: {
        'Content-type': 'application/json',
        'x-token': localStorage.getItem("token-ptin")
      }
    })
    .then(resp => {
      Swal.fire('Éxito', 'Miembro del centro registrado exitosamente.', 'success');
    })
    .catch(err => {
      Swal.fire({
        icon: "error",
        title: "Ooops...",
        text: "Error al registrar al miembro del centro"
      })
    })
}

export const actualizarUcentro = async (ucentros, modal) => {
  try {
    // Realiza la petición PUT a la API
    const response = await mainApi.put(`/api/ucentro/${ucentros._id}`, ucentros, {
      headers: {
        'Content-type': 'application/json',
        'x-token': localStorage.getItem("token-ptin")
      }
    });

    // Verifica si la respuesta es exitosa
    if (response.status === 200) {
      Swal.fire('Éxito', 'Miembro del centro actualizado exitosamente.', 'success');
      // Si necesitas cerrar el modal, puedes hacerlo aquí
      if (modal) {
        modal.close(); // Suponiendo que `modal` es un objeto de un modal que puedes cerrar
      }
    } else {
      throw new Error('Error en la respuesta del servidor');
    }
  } catch (err) {
    console.error('Error al miembro del centro:', err);
    Swal.fire({
      icon: "error",
      title: "Ooops...",
      text: err.message || "Error al actualizar el centro actualizado"
    });
  }
};