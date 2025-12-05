import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabaseClient';


export const fetchDashboardKPIs = createAsyncThunk(
  'dashboard/fetchKPIs',
  async ({ fechaInicio, fechaFin }, { rejectWithValue }) => {
    try {

      const { data, error } = await supabase.rpc('get_dashboard_kpis', {
        fecha_inicio_param: fechaInicio,
        fecha_fin_param: fechaFin
      });

      if (error) {
        console.error('Error de Supabase:', error);
        return rejectWithValue(error.message);
      }

      if (!data) {
        console.error('Data es null o undefined');
        return rejectWithValue('No se recibieron datos');
      }

      let dashboardData;

      if (Array.isArray(data)) {

        if (data.length === 0) {
          console.error('Array vacío');
          return rejectWithValue('No hay datos disponibles');
        }

        const firstItem = data[0];

        if (firstItem && firstItem.hasOwnProperty('get_dashboard_kpis')) {
          dashboardData = firstItem.get_dashboard_kpis;
        } 

        else if (firstItem && firstItem.hasOwnProperty('periodo')) {
          dashboardData = firstItem;
        }
        else {
          dashboardData = firstItem;
        }
      } 

      else if (typeof data === 'object') {

        if (data.hasOwnProperty('get_dashboard_kpis')) {
          dashboardData = data.get_dashboard_kpis;
        }
        else if (data.hasOwnProperty('periodo')) {
          dashboardData = data;
        }
        else {
          dashboardData = data;
        }
      }
      else {
        console.error('Tipo de data no reconocido:', typeof data);
        return rejectWithValue('Formato de datos inesperado');
      }

      if (!dashboardData) {
        return rejectWithValue('Error al procesar los datos');
      }

      return dashboardData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const today = new Date();
const pad = (n) => String(n).padStart(2, '0');
const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

const initialState = {
  data: null,
  loading: false,
  error: null,
  filters: {
    fechaInicio: '2024-01-01',
    fechaFin: todayStr
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