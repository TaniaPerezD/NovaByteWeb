import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  uid: null,
  name: null,
  rol: null,
  token: null,
  isLoading: false
}
export const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    startLoadingUser: (state) => {
      state.isLoading = true
    },
    setUser: (state, action) => {
      state.isLoading = false
      state.uid = action.payload.uid
      state.name = action.payload.name
      state.rol = action.payload.rol
      state.token = action.payload.token
    },
    logout: (state) => {
      state.uid = null
      state.name = null
      state.rol = null
      state.token = null
      state.isLoading = false
    }
  },
})

export const { startLoadingUser, setUser, logout } = usersSlice.actions
export default usersSlice.reducer