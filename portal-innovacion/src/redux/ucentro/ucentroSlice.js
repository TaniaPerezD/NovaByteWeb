import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  ucentro: [],
  isLoading: false
}

export const ucentroSlice = createSlice({
    name: 'ucentro',
    initialState,
    reducers: {
      startLoadingUcentro: (state) => {
        state.isLoading = true;
      },
      setUcentro: (state, action) => { 
        state.ucentro = action.payload;
        state.isLoading = false;
      },
    },
  });
  
export const { startLoadingUcentro, setUcentro } = ucentroSlice.actions;
export default ucentroSlice.reducer
