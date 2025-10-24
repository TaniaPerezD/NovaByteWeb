import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  usociedad: [],
  isLoading: false
}

export const usociedadSlice = createSlice({
    name: 'usociedad',
    initialState,
    reducers: {
      startLoadingUsociedad: (state) => {
        state.isLoading = true;
      },
      setUsociedad: (state, action) => { 
        state.usociedad = action.payload;
        state.isLoading = false;
      },
    },
  });
  
export const { startLoadingUsociedad, setUsociedad } = usociedadSlice.actions;
export default usociedadSlice.reducer
