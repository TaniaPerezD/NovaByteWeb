import Swal from 'sweetalert2'
import { mainApi } from '../../axios'
import { setGraduados, startLoadingGraduado } from './alumniSlice'

export const getGraduados = () => {
  return async(dispatch) => {
    dispatch(startLoadingGraduado())
    await mainApi.get('/api/graduado')
      .then(resp => {
        console.log(resp.data)
        dispatch(setGraduados(resp.data))
      })
      .catch(err => {
        Swal.fire({
          icon: "error",
          title: "Ooops...",
          text: "Graduados no encontrados"
        })
      })
  }
}

export const createGraduado = async(graduado, modal) => {
  console.log("Arrives")
    await mainApi.post('/api/graduado',graduado, {
      headers: {
        'Content-type': 'application/json',
        'x-token': localStorage.getItem("token-ptin")
      }
    })
    .then(resp => {
      Swal.fire('Éxito', 'Graduado registrado exitosamente.', 'success');
    })
    .catch(err => {
      Swal.fire({
        icon: "error",
        title: "Ooops...",
        text: "Error al registrar al graduado"
      })
    })
}

export const actualizarGraduado = async (graduado, modal) => {
  try {
    // Realiza la petición PUT a la API
    const response = await mainApi.put(`/api/graduado/${graduado._id}`, graduado, {
      headers: {
        'Content-type': 'application/json',
        'x-token': localStorage.getItem("token-ptin")
      }
    });

    // Verifica si la respuesta es exitosa
    if (response.status === 200) {
      Swal.fire('Éxito', 'Graduado actualizado exitosamente.', 'success');
      // Si necesitas cerrar el modal, puedes hacerlo aquí
      if (modal) {
        modal.close(); // Suponiendo que `modal` es un objeto de un modal que puedes cerrar
      }
    } else {
      throw new Error('Error en la respuesta del servidor');
    }
  } catch (err) {
    console.error('Error al actualizar al graduad@:', err);
    Swal.fire({
      icon: "error",
      title: "Ooops...",
      text: err.message || "Error al actualizar al graduado"
    });
  }
};