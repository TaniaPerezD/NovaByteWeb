import Swal from 'sweetalert2'
import { mainApi } from '../../axios'
import { setUsociedad, startLoadingUsociedad } from './usociedadSlice'

export const getUsociedad = () => {
  return async(dispatch) => {
    dispatch(startLoadingUsociedad())
    await mainApi.get('/api/usociedad')
      .then(resp => {
        console.log("Usociedad: " + resp.data.usociedad)
        dispatch(setUsociedad(resp.data.usociedad))
      })
      .catch(err => {
        Swal.fire({
          icon: "error",
          title: "Ooops...",
          text: "Miembros de la sociedad no encontrados"
        })
      })
  }
}

export const createUsociedad = async(usociedad, modal) => {
  console.log("Arrives")
    await mainApi.post('/api/usociedad',usociedad, {
      headers: {
        'Content-type': 'application/json',
        'x-token': localStorage.getItem("token-ptin")
      }
    })
    .then(resp => {
      Swal.fire('Éxito', 'Miembro de la sociedad registrado exitosamente.', 'success');
    })
    .catch(err => {
      Swal.fire({
        icon: "error",
        title: "Ooops...",
        text: "Error al registrar al miembro de la sociedad"
      })
    })
}

export const actualizarUsociedad = async (usociedad, modal) => {
  try {
    // Realiza la petición PUT a la API
    const response = await mainApi.put(`/api/usociedad/${usociedad._id}`, usociedad, {
      headers: {
        'Content-type': 'application/json',
        'x-token': localStorage.getItem("token-ptin")
      }
    });

    // Verifica si la respuesta es exitosa
    if (response.status === 200) {
      Swal.fire('Éxito', 'Miembro de la sociedad actualizado exitosamente.', 'success');
      // Si necesitas cerrar el modal, puedes hacerlo aquí
      if (modal) {
        modal.close(); // Suponiendo que `modal` es un objeto de un modal que puedes cerrar
      }
    } else {
      throw new Error('Error en la respuesta del servidor');
    }
  } catch (err) {
    console.error('Error al miembro de la sociedad:', err);
    Swal.fire({
      icon: "error",
      title: "Ooops...",
      text: err.message || "Error al actualizar el miembro actualizado"
    });
  }
};