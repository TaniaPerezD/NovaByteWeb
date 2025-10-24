import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  noticias: [],
  noticiaId: {},
  total: 0,
  isLoading: false
}

export const noticiasSlice = createSlice({
  name: 'noticias',
  initialState,
  reducers: {
    startLoadingNoticia: (state) => {
      state.isLoading = true
    },
    setNoticia: (state, action) => {
      state.noticias = action.payload.noticias
      state.total = action.payload.total
      state.isLoading = false
    },
    setNoticiaId: (state, action) => {
      state.noticiaId = action.payload.noticia
    }
  }
})

export const { startLoadingNoticia, setNoticia, setNoticiaId } = noticiasSlice.actions
export default noticiasSlice.reducer