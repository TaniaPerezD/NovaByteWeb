import Swal from 'sweetalert2'
import { mainApi } from '../../axios'
import { deleteEmpresa, setEmpresas, startLoadingEmpresa } from './empresasSlice'

export const getEmpresas = () => {
  return async(dispatch) => {
    dispatch(startLoadingEmpresa)
    await mainApi.get('/api/empresas')
      .then(resp => {
        console.log(resp.data)
        dispatch(setEmpresas(resp.data))
      })
      .catch(err => {
        Swal.fire({
          icon: "error",
          title: "Ooops...",
          text: "Empresas no encontradas"
        })
      })
  }
}

export const createEmpresa = async(empresa, modal) => {
  console.log("Arrives")
    await mainApi.post('/api/empresas',empresa, {
      headers: {
        'Content-type': 'application/json',
        'x-token': localStorage.getItem("token-ptin")
      }
    })
    .then(resp => {
      Swal.fire('Éxito', 'Empresa aliada registrada exitosamente.', 'success');
    })
    .catch(err => {
      Swal.fire({
        icon: "error",
        title: "Ooops...",
        text: "Error al crear empresa"
      })
    })
}

export const actualizarEmpresa = async (empresa, modal) => {
  try {
    // Realiza la petición PUT a la API
    const response = await mainApi.put(`/api/empresas/${empresa._id}`, empresa, {
      headers: {
        'Content-type': 'application/json',
        'x-token': localStorage.getItem("token-ptin")
      }
    });

    // Verifica si la respuesta es exitosa
    if (response.status === 200) {
      Swal.fire('Éxito', 'Empresa aliada actualizada exitosamente.', 'success');
      // Si necesitas cerrar el modal, puedes hacerlo aquí
      if (modal) {
        modal.close(); // Suponiendo que `modal` es un objeto de un modal que puedes cerrar
      }
    } else {
      throw new Error('Error en la respuesta del servidor');
    }
  } catch (err) {
    console.error('Error al actualizar empresa:', err);
    Swal.fire({
      icon: "error",
      title: "Ooops...",
      text: err.message || "Error al actualizar empresa"
    });
  }
};

export const borrarEmpresa = (id) => {
  return async(dispatch) => {
    console.log("ID:" + id)
    await mainApi.patch(`/api/empresas/${id}`, {}, {
      headers: {
        'x-token': localStorage.getItem("token-ptin")
      }
    })
      .then(resp => {
        console.log("Empresa borrada")
        dispatch(deleteEmpresa(id))
      })
      .catch(err => {
        console.log(err)
        Swal.fire({
          icon: "error",
          title: "Ooops...",
          text: "Problemas al borrar"
        })
      })
  }
}