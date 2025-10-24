import { mainApi } from '../axios'

export const crearUser = async (name,email, password,rol,isDeleted) => {
  return await mainApi.post('/api/auth/new', {
    name,
    email,
    password,
    rol,
    isDeleted
  })
}

export const revalidarToken = async (ui,name) => {
  return await mainApi.post('/api/auth/new', {
    ui,
    name
  })
}