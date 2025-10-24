import Swal from 'sweetalert2'
import { mainApi } from '../../axios'
import { setCentro, startLoadingCentro } from './centroSlice'

export const getCentro = () => {
  return async(dispatch) => {
    dispatch(startLoadingCentro)
    await mainApi.get('/api/centro')
      .then(resp => {
        console.log(resp.data.centros[0])
        dispatch(setCentro(resp.data.centros[0]))
      })
      .catch(err => {
        Swal.fire({
          icon: "error",
          title: "Ooops...",
          text: "Centro no encontrado"
        })
      })
  }
}

export const createCentro = async(centro, modal) => {
  console.log("Arrives")
    await mainApi.post('/api/centro',centro, {
      headers: {
        'Content-type': 'application/json',
        'x-token': localStorage.getItem("token-ptin")
      }
    })
    .then(resp => {
      Swal.fire('Éxito', 'Centro registrado exitosamente.', 'success');
    })
    .catch(err => {
      Swal.fire({
        icon: "error",
        title: "Ooops...",
        text: "Error al crear el centro"
      })
    })
}

export const actualizarCentro = async (centro, modal) => {
  try {
    // Realiza la petición PUT a la API
    const response = await mainApi.put(`/api/centro/${centro._id}`, centro, {
      headers: {
        'Content-type': 'application/json',
        'x-token': localStorage.getItem("token-ptin")
      }
    });

    // Verifica si la respuesta es exitosa
    if (response.status === 200) {
      Swal.fire('Éxito', 'Centro actualizado exitosamente.', 'success');
      // Si necesitas cerrar el modal, puedes hacerlo aquí
      if (modal) {
        modal.close(); // Suponiendo que `modal` es un objeto de un modal que puedes cerrar
      }
    } else {
      throw new Error('Error en la respuesta del servidor');
    }
  } catch (err) {
    console.error('Error al actualizar el centro:', err);
    Swal.fire({
      icon: "error",
      title: "Ooops...",
      text: err.message || "Error al actualizar el centro de estudiantes"
    });
  }
};