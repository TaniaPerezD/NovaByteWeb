import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  sociedad: {
    members: []
  },
  isLoading: false
}

export const sociedadSlice = createSlice({
  name: 'sociedad',
  initialState,
  reducers: {
    startLoadingSociedad: (state) => {
      state.isLoading = true
    },
    setSociedad: (state, action) => {
      state.sociedad = action.payload
      state.isLoading = false
    },
  }
})

export const { startLoadingSociedad, setSociedad } = sociedadSlice.actions
export default sociedadSlice.reducer