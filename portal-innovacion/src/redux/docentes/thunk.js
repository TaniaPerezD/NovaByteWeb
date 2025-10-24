import Swal from 'sweetalert2'
import { mainApi } from '../../axios'
import { setDocentes, startLoadingDocente } from './docenteSlice'

export const getDocentes = () => {
  return async(dispatch) => {
    dispatch(startLoadingDocente())
    await mainApi.get('/api/docente')
      .then(resp => {
        console.log(resp.data)
        dispatch(setDocentes(resp.data))
      })
      .catch(err => {
        Swal.fire({
          icon: "error",
          title: "Ooops...",
          text: "Docentes no encontrados"
        })
      })
  }
}

export const createDocente = async(docente, modal) => {
  console.log("Arrives");
  console.log("Datos enviados:", docente);
    await mainApi.post('/api/docente',docente, {
      headers: {
        'Content-type': 'application/json',
        'x-token': localStorage.getItem("token-ptin")
      }
    })
    .then(resp => {
      Swal.fire('Éxito', 'Docente registrado exitosamente.', 'success');
    })
    .catch(err => {
      Swal.fire({
        icon: "error",
        title: "Ooops...",
        text: "Error al registrar al docente"
      })
    })
}

export const actualizarDocente = async (docente, modal) => {
  try {
    // Realiza la petición PUT a la API
    const response = await mainApi.put(`/api/docente/${docente._id}`, docente, {
      headers: {
        'Content-type': 'application/json',
        'x-token': localStorage.getItem("token-ptin")
      }
    });

    // Verifica si la respuesta es exitosa
    if (response.status === 200) {
      Swal.fire('Éxito', 'Docente actualizado exitosamente.', 'success');
      // Si necesitas cerrar el modal, puedes hacerlo aquí
      if (modal) {
        modal.close(); // Suponiendo que `modal` es un objeto de un modal que puedes cerrar
      }
    } else {
      throw new Error('Error en la respuesta del servidor');
    }
  } catch (err) {
    console.error('Error al actualizar el docente:', err);
    Swal.fire({
      icon: "error",
      title: "Ooops...",
      text: err.message || "Error al actualizar el docente"
    });
  }
};