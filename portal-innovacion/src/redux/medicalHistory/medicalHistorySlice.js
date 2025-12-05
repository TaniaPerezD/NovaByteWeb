import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabaseClient';

// Thunk para cargar archivos clínicos de un paciente
export const fetchClinicalFiles = createAsyncThunk(
  'medicalHistory/fetchClinicalFiles',
  async (pacienteId, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('archivo_clinico')
        .select(`
          id,
          tipo,
          descripcion,
          created_at,
          paciente_id,
          consultas:consulta(
            id,
            motivo,
            anamnesis,
            examen_fisico,
            plan,
            observaciones,
            created_at
          )
        `)
        .eq('paciente_id', pacienteId)
        .order('created_at', { ascending: false });

        if (error) throw error;

        const transformedData = data.map(file => {
          // Ordenar consultas por fecha (ascendentes)
          const consultasOrdenadas = [...file.consultas].sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at));

        const primeraConsulta = consultasOrdenadas.length > 0 ? consultasOrdenadas[0] : null;

        return {
          id: file.id,
          tipo: file.tipo || 'General',
          descripcion: file.descripcion || '',
          fechaCreacion: file.created_at.split('T')[0],

          consultas: consultasOrdenadas.map(consulta => ({
            id: consulta.id,
            motivo: consulta.motivo || '',
            examenenFisico: consulta.examen_fisico || '',
            anamnesis: consulta.anamnesis || '',
            plan: consulta.plan || '',
            observaciones: consulta.observaciones || '',
            fecha: consulta.created_at.split('T')[0]
          })),

          primeraConsulta: primeraConsulta
            ? {
                id: primeraConsulta.id,
                motivo: primeraConsulta.motivo || '',
                anamnesis: primeraConsulta.anamnesis || '',
                examen_fisico: primeraConsulta.examen_fisico || '',
                plan: primeraConsulta.plan || '',
                observaciones: primeraConsulta.observaciones || '',
                fecha: primeraConsulta.created_at.split('T')[0]
              }
            : null
        };
      });

      return transformedData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para crear archivo clínico
export const createClinicalFile = createAsyncThunk(
  'medicalHistory/createClinicalFile',
  async ({ pacienteId, fileData }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('archivo_clinico')
        .insert({
          paciente_id: pacienteId,
          tipo: fileData.tipo,
          descripcion: fileData.descripcion,
          url: fileData.url || '' // Campo requerido en la BD
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        tipo: data.tipo,
        descripcion: data.descripcion,
        fechaCreacion: data.created_at.split('T')[0],
        consultas: []
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para actualizar archivo clínico
export const updateClinicalFile = createAsyncThunk(
  'medicalHistory/updateClinicalFile',
  async ({ fileId, fileData }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('archivo_clinico')
        .update({
          tipo: fileData.tipo,
          descripcion: fileData.descripcion
        })
        .eq('id', fileId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        tipo: data.tipo,
        descripcion: data.descripcion,
        fechaCreacion: data.created_at.split('T')[0]
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para crear consulta médica
export const createConsultation = createAsyncThunk(
  'medicalHistory/createConsultation',
  async ({ archivoClinicoId, pacienteId, medicoId, consultationData }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('consulta')
        .insert({
          archivo_clinico_id: archivoClinicoId,
          paciente_id: pacienteId,
          medico_id: medicoId,
          motivo: consultationData.motivo,
          anamnesis: consultationData.anamnesis,
          examen_fisico: consultationData.examen_fisico,
          plan: consultationData.plan,
          observaciones: consultationData.observaciones
        })
        .select()
        .single();

      if (error) throw error;

      return {
        archivoClinicoId,
        consulta: {
          id: data.id,
          motivo: data.motivo || '',
          examen_fisico: data.examen_fisico || '',
          anamnesis: data.anamnesis || '',
          plan: data.plan || '',
          observaciones: data.observaciones || '',
          fecha: data.created_at.split('T')[0]
        }
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Obtener perfil_id por email
export const fetchPerfilIdByEmail = createAsyncThunk(
  'medicalHistory/fetchPerfilIdByEmail',
  async (email, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from("perfil")
        .select("id")
        .eq("email", email)
        .single();

      if (error) throw error;

      return data.id; 
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const medicalHistorySlice = createSlice({
  name: 'medicalHistory',
  initialState: {
    files: [],
    loading: false,
    error: null,
    currentPatientId: null,
    medicoId: null
  },
  reducers: {
    clearMedicalHistory: (state) => {
      state.files = [];
      state.currentPatientId = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch clinical files
      .addCase(fetchClinicalFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClinicalFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.files = action.payload;
      })
      .addCase(fetchClinicalFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create clinical file
      .addCase(createClinicalFile.pending, (state) => {
        state.loading = true;
      })
      .addCase(createClinicalFile.fulfilled, (state, action) => {
        state.loading = false;
        state.files.unshift(action.payload);
      })
      .addCase(createClinicalFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update clinical file
      .addCase(updateClinicalFile.fulfilled, (state, action) => {
        const index = state.files.findIndex(f => f.id === action.payload.id);
        if (index !== -1) {
          state.files[index] = {
            ...state.files[index],
            ...action.payload
          };
        }
      })
      // Create consultation
      .addCase(createConsultation.fulfilled, (state, action) => {
        const file = state.files.find(f => f.id === action.payload.archivoClinicoId);
        if (file) {
          file.consultas.push(action.payload.consulta);
        }
      })
      //IDMEDICO
      .addCase(fetchPerfilIdByEmail.fulfilled, (state, action) => {
        state.medicoId = action.payload;
      })
      .addCase(fetchPerfilIdByEmail.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const { clearMedicalHistory } = medicalHistorySlice.actions;
export default medicalHistorySlice.reducer;