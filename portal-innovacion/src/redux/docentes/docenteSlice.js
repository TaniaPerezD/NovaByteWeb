import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  docentes: [],
  isLoading: false
}

export const docenteSlice = createSlice({
  name: 'docentes',
  initialState,
  reducers: {
    startLoadingDocente: (state) => {
      state.isLoading = true
    },
    setDocentes: (state, action) => {
      state.docentes = action.payload.docentes
      state.isLoading = false
    },
  }
})

export const { startLoadingDocente, setDocentes } = docenteSlice.actions
export default docenteSlice.reducer