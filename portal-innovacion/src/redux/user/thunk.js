import Swal from 'sweetalert2'
import { mainApi } from '../../axios'
import { setUser, startLoadingUser } from './userSlice'

export const loginUser = (email, password) => {
  return async(dispatch) => {

    dispatch(startLoadingUser())
    await mainApi.post('/api/auth', {
      email,
      password
    })
    .then(resp => {
      dispatch(setUser(resp.data))
      localStorage.setItem("user-ptin", resp.data.name)
      localStorage.setItem("token-ptin", resp.data.token)
      localStorage.setItem("rol-ptin", resp.data.rol)
      localStorage.setItem("uid-ptin", resp.data.uid)
    })
    .catch(err => {
      Swal.fire({
        icon: "error",
        title: "Ooops...",
        text: "Usuario o contraseña incorrectos"
      })
    })
  }
}

export const createUser = async(graduado, modal) => {
  console.log("Arrives")
    await mainApi.post('/api/auth',graduado, {
      headers: {
        'Content-type': 'application/json',
        'x-token': localStorage.getItem("token-ptin")
      }
    })
    .then(resp => {
      Swal.fire('Éxito', 'Usuario registrado exitosamente.', 'success');
    })
    .catch(err => {
      Swal.fire({
        icon: "error",
        title: "Ooops...",
        text: "Error al registrar al usuario"
      })
    })
}

