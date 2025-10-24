import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  graduados: [],
  isLoading: false
}

export const alumniSlice = createSlice({
  name: 'graduados',
  initialState,
  reducers: {
    startLoadingGraduado: (state) => {
      state.isLoading = true
    },
    setGraduados: (state, action) => {
      state.graduados = action.payload.graduados
      state.isLoading = false
    },
  }
})

export const { startLoadingGraduado, setGraduados } = alumniSlice.actions
export default alumniSlice.reducer