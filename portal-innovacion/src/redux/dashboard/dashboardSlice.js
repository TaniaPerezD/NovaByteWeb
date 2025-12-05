import { createSlice } from '@reduxjs/toolkit';
import { fetchDashboardKPIs } from './thunks';

const initialState = {
  data: null,
  loading: false,
  error: null,
  filters: {
    fechaInicio: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Primer día del año
    fechaFin: new Date().toISOString().split('T')[0] // Hoy
  }
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setFechaInicio: (state, action) => {
      state.filters.fechaInicio = action.payload;
    },
    setFechaFin: (state, action) => {
      state.filters.fechaFin = action.payload;
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardKPIs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardKPIs.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchDashboardKPIs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error al cargar los datos del dashboard';
      });
  }
});

export const { setFechaInicio, setFechaFin, resetFilters, clearError } = dashboardSlice.actions;

export default dashboardSlice.reducer;