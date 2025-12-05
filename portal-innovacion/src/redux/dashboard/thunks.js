// import { supabase } from '../services/supabaseClient';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const fetchDashboardKPIs = createAsyncThunk(
  'dashboard/fetchKPIs',
  async ({ fechaInicio, fechaFin }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.rpc('get_dashboard_kpis', {
        fecha_inicio_param: fechaInicio,
        fecha_fin_param: fechaFin
      });

      if (error) {
        console.error('Error al obtener KPIs:', error);
        return rejectWithValue(error.message);
      }

      const dashboardData = Array.isArray(data) ? data[0] : data;
      
      return dashboardData?.get_dashboard_kpis || dashboardData;
    } catch (error) {
      console.error('Error en fetchDashboardKPIs:', error);
      return rejectWithValue(error.message);
    }
  }
);