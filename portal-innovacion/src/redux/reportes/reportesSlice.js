import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apolloClient } from '../../../src/config/apolloClient';
import {
  GENERAR_HISTORIA_CLINICA_PDF,
  GENERAR_AGENDA_MEDICO_PDF,
  GENERAR_DESEMPENO_MEDICOS_PDF,
  GENERAR_DESEMPENO_MEDICOS_EXCEL,
  GENERAR_DASHBOARD_ESTADISTICAS_PDF,
  OBTENER_ESTADISTICAS_GENERALES,
  OBTENER_ESTADISTICAS_MEDICO
} from './reportesQueries';

// Thunks para generar reportes
export const generarHistoriaClinicaPDF = createAsyncThunk(
  'reportes/generarHistoriaClinicaPDF',
  async (filtro, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: GENERAR_HISTORIA_CLINICA_PDF,
        variables: { filtro }
      });
      return data.generarHistoriaClinicaPDF;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const generarAgendaMedicoPDF = createAsyncThunk(
  'reportes/generarAgendaMedicoPDF',
  async (filtro, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: GENERAR_AGENDA_MEDICO_PDF,
        variables: { filtro }
      });
      return data.generarAgendaMedicoPDF;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const generarDesempenoMedicosPDF = createAsyncThunk(
  'reportes/generarDesempenoMedicosPDF',
  async (filtro, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: GENERAR_DESEMPENO_MEDICOS_PDF,
        variables: { filtro }
      });
      return data.generarDesempenoMedicosPDF;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const generarDesempenoMedicosExcel = createAsyncThunk(
  'reportes/generarDesempenoMedicosExcel',
  async (filtro, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: GENERAR_DESEMPENO_MEDICOS_EXCEL,
        variables: { filtro }
      });
      return data.generarDesempenoMedicosExcel;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const generarDashboardEstadisticasPDF = createAsyncThunk(
  'reportes/generarDashboardEstadisticasPDF',
  async (filtro, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: GENERAR_DASHBOARD_ESTADISTICAS_PDF,
        variables: { filtro }
      });
      return data.generarDashboardEstadisticasPDF;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunks para obtener estadísticas
export const fetchEstadisticasGenerales = createAsyncThunk(
  'reportes/fetchEstadisticasGenerales',
  async (filtro, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: OBTENER_ESTADISTICAS_GENERALES,
        variables: { filtro },
        fetchPolicy: 'network-only'
      });
      return data.estadisticasGenerales;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchEstadisticasMedico = createAsyncThunk(
  'reportes/fetchEstadisticasMedico',
  async (filtro, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query({
        query: OBTENER_ESTADISTICAS_MEDICO,
        variables: { filtro },
        fetchPolicy: 'network-only'
      });
      return data.estadisticasMedico;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  reportes: [],
  estadisticasGenerales: null,
  estadisticasMedico: null,
  loading: false,
  error: null,
  lastGenerated: null
};

const reportesSlice = createSlice({
  name: 'reportes',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addReporteToHistory: (state, action) => {
      state.reportes.unshift(action.payload);
      if (state.reportes.length > 10) {
        state.reportes.pop();
      }
    },
    clearReportesHistory: (state) => {
      state.reportes = [];
    }
  },
  extraReducers: (builder) => {
    // Historia Clínica PDF
    builder
      .addCase(generarHistoriaClinicaPDF.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generarHistoriaClinicaPDF.fulfilled, (state, action) => {
        state.loading = false;
        state.lastGenerated = action.payload;
        state.reportes.unshift(action.payload);
      })
      .addCase(generarHistoriaClinicaPDF.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Agenda Médico PDF
    builder
      .addCase(generarAgendaMedicoPDF.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generarAgendaMedicoPDF.fulfilled, (state, action) => {
        state.loading = false;
        state.lastGenerated = action.payload;
        state.reportes.unshift(action.payload);
      })
      .addCase(generarAgendaMedicoPDF.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Desempeño Médicos PDF
    builder
      .addCase(generarDesempenoMedicosPDF.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generarDesempenoMedicosPDF.fulfilled, (state, action) => {
        state.loading = false;
        state.lastGenerated = action.payload;
        state.reportes.unshift(action.payload);
      })
      .addCase(generarDesempenoMedicosPDF.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Desempeño Médicos Excel
    builder
      .addCase(generarDesempenoMedicosExcel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generarDesempenoMedicosExcel.fulfilled, (state, action) => {
        state.loading = false;
        state.lastGenerated = action.payload;
        state.reportes.unshift(action.payload);
      })
      .addCase(generarDesempenoMedicosExcel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Dashboard Estadísticas PDF
    builder
      .addCase(generarDashboardEstadisticasPDF.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generarDashboardEstadisticasPDF.fulfilled, (state, action) => {
        state.loading = false;
        state.lastGenerated = action.payload;
        state.reportes.unshift(action.payload);
      })
      .addCase(generarDashboardEstadisticasPDF.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Estadísticas Generales
    builder
      .addCase(fetchEstadisticasGenerales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEstadisticasGenerales.fulfilled, (state, action) => {
        state.loading = false;
        state.estadisticasGenerales = action.payload;
      })
      .addCase(fetchEstadisticasGenerales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Estadísticas Médico
    builder
      .addCase(fetchEstadisticasMedico.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEstadisticasMedico.fulfilled, (state, action) => {
        state.loading = false;
        state.estadisticasMedico = action.payload;
      })
      .addCase(fetchEstadisticasMedico.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, addReporteToHistory, clearReportesHistory } = reportesSlice.actions;
export default reportesSlice.reducer;