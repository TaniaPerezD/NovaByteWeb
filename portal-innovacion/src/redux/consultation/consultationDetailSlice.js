import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabaseClient';

// Thunk para obtener datos completos de una consulta específica
export const fetchConsultationDetail = createAsyncThunk(
  'consultationDetail/fetchConsultationDetail',
  async ({ pacienteId, consultaId }, { rejectWithValue }) => {
    try {
      // 1. Obtener la consulta específica con todos sus datos relacionados
      const { data: consultaData, error: consultaError } = await supabase
        .from('consulta')
        .select(`
          id,
          motivo,
          anamnesis,
          examen_fisico,
          plan,
          observaciones,
          created_at,
          paciente_id,
          medico_id,
          archivo_clinico_id,
          examen (
            id,
            tipo,
            indicacion,
            created_at,
            resultado_examen (
              id,
              informe,
              hallazgos,
              fecha_resultado,
              adjunto_url
            )
          ),
          signos_vitales (
            id,
            presion_sistolica,
            presion_diastolica,
            frecuencia_cardiaca,
            temperatura,
            saturacion_oxigeno,
            peso_kg,
            talla_cm,
            created_at
          ),
          receta (
            id,
            indicaciones_generales,
            created_at,
            receta_item (
              id,
              medicamento,
              via,
              dosis,
              frecuencia,
              duracion
            )
          ),
          diagnostico (
            id,
            codigo,
            descripcion,
            principal
          )
        `)
        .eq('id', consultaId)
        .single();

      if (consultaError) throw consultaError;

      // 2. Obtener todas las consultas del MISMO ARCHIVO CLÍNICO para determinar la primera
      const { data: consultasArchivo, error: consultasError } = await supabase
        .from('consulta')
        .select('id, created_at')
        .eq('archivo_clinico_id', consultaData.archivo_clinico_id)
        .order('created_at', { ascending: true });

      if (consultasError) throw consultasError;

      const primeraConsultaId = consultasArchivo.length > 0 ? consultasArchivo[0].id : null;
      const isFirstConsultation = consultaId === primeraConsultaId;

      // 3. Si no es la primera consulta, obtener datos de la primera del archivo clínico
      let firstConsultationData = null;
      if (!isFirstConsultation && primeraConsultaId) {
        const { data: primeraConsulta, error: primeraError } = await supabase
          .from('consulta')
          .select(`
            id,
            motivo,
            anamnesis,
            examen_fisico,
            plan,
            observaciones,
            created_at,
            examen (
              id,
              tipo,
              indicacion,
              created_at,
              resultado_examen (
                id,
                informe,
                hallazgos,
                fecha_resultado
              )
            ),
            signos_vitales (
              id,
              presion_sistolica,
              presion_diastolica,
              frecuencia_cardiaca,
              temperatura,
              saturacion_oxigeno,
              peso_kg,
              talla_cm
            ),
            receta (
              id,
              indicaciones_generales,
              created_at,
              receta_item (
                id,
                medicamento,
                via,
                dosis,
                frecuencia,
                duracion
              )
            ),
            diagnostico (
              id,
              codigo,
              descripcion,
              principal
            )
          `)
          .eq('id', primeraConsultaId)
          .single();

        if (primeraError) throw primeraError;
        firstConsultationData = transformConsultationData(primeraConsulta);
      }

      // 4. Obtener alergias del paciente
      const { data: alergias, error: alergiasError } = await supabase
        .from('alergia')
        .select('*')
        .eq('paciente_id', pacienteId);

      if (alergiasError) throw alergiasError;

      // 5. Obtener antecedentes del paciente
      const { data: antecedentes, error: antecedentesError } = await supabase
        .from('antecedente')
        .select('*')
        .eq('paciente_id', pacienteId);

      if (antecedentesError) throw antecedentesError;

      return {
        consultation: transformConsultationData(consultaData),
        firstConsultation: firstConsultationData,
        isFirstConsultation,
        allergies: alergias.map(a => ({
          id: a.id,
          sustancia: a.sustancia,
          severidad: a.severidad,
          observacion: a.observacion
        })),
        backgrounds: antecedentes.map(ant => ({
          id: ant.id,
          tipo: ant.tipo,
          descripcion: ant.descripcion
        }))
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Función auxiliar para transformar datos de consulta
const transformConsultationData = (consulta) => {
  return {
    id: consulta.id,
    motivo: consulta.motivo || '',
    examen_fisico: consulta.examen_fisico || '',
    anamnesis: consulta.anamnesis || '',
    plan: consulta.plan || '',
    observaciones: consulta.observaciones || '',
    fecha: consulta.created_at.split('T')[0],
    exams: consulta.examen?.map(ex => ({
      id: ex.id,
      tipo: ex.tipo,
      indicacion: ex.indicacion || '',
      resultados: ex.resultado_examen?.map(res => ({
        id: res.id,
        informe: res.informe || '',
        hallazgo: res.hallazgos,
        fecha_resultado: res.fecha_resultado,
        adjunto_url: res.adjunto_url
      })) || []
    })) || [],
    vitalSigns: consulta.signos_vitales?.[0] ? {
      id: consulta.signos_vitales[0].id,
      presion_sistolica: consulta.signos_vitales[0].presion_sistolica,
      presion_diastolica: consulta.signos_vitales[0].presion_diastolica,
      frecuencia_cardiaca: consulta.signos_vitales[0].frecuencia_cardiaca,
      temperatura: consulta.signos_vitales[0].temperatura,
      saturacion_oxigeno: consulta.signos_vitales[0].saturacion_oxigeno,
      peso_kg: consulta.signos_vitales[0].peso_kg,
      talla_cm: consulta.signos_vitales[0].talla_cm
    } : null,
    prescription: consulta.receta?.[0] ? {
      id: consulta.receta[0].id,
      fecha: consulta.receta[0].created_at.split('T')[0],
      indicaciones_generales: consulta.receta[0].indicaciones_generales || '',
      items: consulta.receta[0].receta_item?.map(item => ({
        id: item.id,
        medicamento: item.medicamento,
        via: item.via,
        dosis: item.dosis,
        frecuencia: item.frecuencia,
        duracion: item.duracion
      })) || []
    } : null,
    diagnoses: consulta.diagnostico?.map(diag => ({
      id: diag.id,
      codigo: diag.codigo,
      descripcion: diag.descripcion,
      principal: diag.principal
    })) || []
  };
};

// Thunk para actualizar consulta
export const updateConsultation = createAsyncThunk(
  'consultationDetail/updateConsultation',
  async ({ consultaId, consultationData }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('consulta')
        .update({
          motivo: consultationData.motivo,
          anamnesis: consultationData.anamnesis,
          examen_fisico: consultationData.examen_fisico,
          plan: consultationData.plan,
          observaciones: consultationData.observaciones
        })
        .eq('id', consultaId)
        .select()
        .single();

      if (error) throw error;

      return {
        motivo: data.motivo,
        anamnesis: data.anamnesis,
        examen_fisico: data.examen_fisico,
        plan: data.plan,
        observaciones: data.observaciones
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para crear examen
export const createExam = createAsyncThunk(
  'consultationDetail/createExam',
  async ({ consultaId, examData }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('examen')
        .insert({
          consulta_id: consultaId,
          tipo: examData.tipo,
          indicacion: examData.indicacion
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        tipo: data.tipo,
        indicacion: data.indicacion || '',
        resultados: []
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para actualizar examen
export const updateExam = createAsyncThunk(
  'consultationDetail/updateExam',
  async ({ examId, examData }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('examen')
        .update({
          tipo: examData.tipo,
          indicacion: examData.indicacion
        })
        .eq('id', examId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        tipo: data.tipo,
        indicacion: data.indicacion || ''
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para crear resultado de examen
export const createExamResult = createAsyncThunk(
  'consultationDetail/createExamResult',
  async ({ examId, resultData }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('resultado_examen')
        .insert({
          examen_id: examId,
          informe: resultData.informe,
          hallazgos: resultData.hallazgo,
          fecha_resultado: resultData.fecha_resultado || new Date().toISOString().split('T')[0],
          adjunto_url: resultData.adjunto_url
        })
        .select()
        .single();

      if (error) throw error;

      return {
        examId,
        result: {
          id: data.id,
          informe: data.informe || '',
          hallazgo: data.hallazgos,
          fecha_resultado: data.fecha_resultado,
          adjunto_url: data.adjunto_url
        }
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para actualizar resultado de examen
export const updateExamResult = createAsyncThunk(
  'consultationDetail/updateExamResult',
  async ({ resultId, examId, resultData }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('resultado_examen')
        .update({
          informe: resultData.informe,
          hallazgos: resultData.hallazgo,
          fecha_resultado: resultData.fecha_resultado,
          adjunto_url: resultData.adjunto_url
        })
        .eq('id', resultId)
        .select()
        .single();

      if (error) throw error;

      return {
        examId,
        result: {
          id: data.id,
          informe: data.informe || '',
          hallazgo: data.hallazgos,
          fecha_resultado: data.fecha_resultado,
          adjunto_url: data.adjunto_url
        }
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para crear/actualizar signos vitales
export const saveVitalSigns = createAsyncThunk(
  'consultationDetail/saveVitalSigns',
  async ({ consultaId, vitalSignsData, existingId }, { rejectWithValue }) => {
    try {
      if (existingId) {
        // Actualizar
        const { data, error } = await supabase
          .from('signos_vitales')
          .update({
            presion_sistolica: vitalSignsData.presion_sistolica,
            presion_diastolica: vitalSignsData.presion_diastolica,
            frecuencia_cardiaca: vitalSignsData.frecuencia_cardiaca,
            temperatura: vitalSignsData.temperatura,
            saturacion_oxigeno: vitalSignsData.saturacion_oxigeno,
            peso_kg: vitalSignsData.peso_kg,
            talla_cm: vitalSignsData.talla_cm
          })
          .eq('id', existingId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Crear
        const { data, error } = await supabase
          .from('signos_vitales')
          .insert({
            consulta_id: consultaId,
            presion_sistolica: vitalSignsData.presion_sistolica,
            presion_diastolica: vitalSignsData.presion_diastolica,
            frecuencia_cardiaca: vitalSignsData.frecuencia_cardiaca,
            temperatura: vitalSignsData.temperatura,
            saturacion_oxigeno: vitalSignsData.saturacion_oxigeno,
            peso_kg: vitalSignsData.peso_kg,
            talla_cm: vitalSignsData.talla_cm
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para crear/actualizar receta
export const savePrescription = createAsyncThunk(
  'consultationDetail/savePrescription',
  async ({ consultaId, prescriptionData, existingId }, { rejectWithValue }) => {
    try {
      if (existingId) {
        // Actualizar
        const { data, error } = await supabase
          .from('receta')
          .update({
            indicaciones_generales: prescriptionData.indicaciones_generales
          })
          .eq('id', existingId)
          .select()
          .single();

        if (error) throw error;
        return {
          id: data.id,
          fecha: data.created_at.split('T')[0],
          indicaciones_generales: data.indicaciones_generales || ''
        };
      } else {
        // Crear
        const { data, error } = await supabase
          .from('receta')
          .insert({
            consulta_id: consultaId,
            indicaciones_generales: prescriptionData.indicaciones_generales
          })
          .select()
          .single();

        if (error) throw error;
        return {
          id: data.id,
          fecha: data.created_at.split('T')[0],
          indicaciones_generales: data.indicaciones_generales || ''
        };
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para crear item de receta
export const createPrescriptionItem = createAsyncThunk(
  'consultationDetail/createPrescriptionItem',
  async ({ recetaId, itemData }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('receta_item')
        .insert({
          receta_id: recetaId,
          medicamento: itemData.medicamento,
          via: itemData.via,
          dosis: itemData.dosis,
          frecuencia: itemData.frecuencia,
          duracion: itemData.duracion
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        medicamento: data.medicamento,
        via: data.via,
        dosis: data.dosis,
        frecuencia: data.frecuencia,
        duracion: data.duracion
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para actualizar item de receta
export const updatePrescriptionItem = createAsyncThunk(
  'consultationDetail/updatePrescriptionItem',
  async ({ itemId, itemData }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('receta_item')
        .update({
          medicamento: itemData.medicamento,
          via: itemData.via,
          dosis: itemData.dosis,
          frecuencia: itemData.frecuencia,
          duracion: itemData.duracion
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        medicamento: data.medicamento,
        via: data.via,
        dosis: data.dosis,
        frecuencia: data.frecuencia,
        duracion: data.duracion
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para crear diagnóstico
export const createDiagnosis = createAsyncThunk(
  'consultationDetail/createDiagnosis',
  async ({ consultaId, diagnosisData }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('diagnostico')
        .insert({
          consulta_id: consultaId,
          codigo: diagnosisData.codigo,
          descripcion: diagnosisData.descripcion,
          principal: diagnosisData.principal
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        codigo: data.codigo,
        descripcion: data.descripcion,
        principal: data.principal
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para actualizar diagnóstico
export const updateDiagnosis = createAsyncThunk(
  'consultationDetail/updateDiagnosis',
  async ({ diagnosisId, diagnosisData }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('diagnostico')
        .update({
          codigo: diagnosisData.codigo,
          descripcion: diagnosisData.descripcion,
          principal: diagnosisData.principal
        })
        .eq('id', diagnosisId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        codigo: data.codigo,
        descripcion: data.descripcion,
        principal: data.principal
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const consultationDetailSlice = createSlice({
  name: 'consultationDetail',
  initialState: {
    consultation: null,
    firstConsultation: null,
    isFirstConsultation: false,
    allergies: [],
    backgrounds: [],
    loading: false,
    error: null
  },
  reducers: {
    clearConsultationDetail: (state) => {
      state.consultation = null;
      state.firstConsultation = null;
      state.isFirstConsultation = false;
      state.allergies = [];
      state.backgrounds = [];
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch consultation detail
      .addCase(fetchConsultationDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConsultationDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.consultation = action.payload.consultation;
        state.firstConsultation = action.payload.firstConsultation;
        state.isFirstConsultation = action.payload.isFirstConsultation;
        state.allergies = action.payload.allergies;
        state.backgrounds = action.payload.backgrounds;
      })
      .addCase(fetchConsultationDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update consultation
      .addCase(updateConsultation.fulfilled, (state, action) => {
        if (state.consultation) {
          state.consultation = { ...state.consultation, ...action.payload };
        }
      })
      // Create exam
      .addCase(createExam.fulfilled, (state, action) => {
        if (state.consultation) {
          state.consultation.exams.push(action.payload);
        }
      })
      // Update exam
      .addCase(updateExam.fulfilled, (state, action) => {
        if (state.consultation) {
          const index = state.consultation.exams.findIndex(e => e.id === action.payload.id);
          if (index !== -1) {
            state.consultation.exams[index] = {
              ...state.consultation.exams[index],
              ...action.payload
            };
          }
        }
      })
      // Create exam result
      .addCase(createExamResult.fulfilled, (state, action) => {
        if (state.consultation) {
          const exam = state.consultation.exams.find(e => e.id === action.payload.examId);
          if (exam) {
            exam.resultados.push(action.payload.result);
          }
        }
      })
      // Update exam result
      .addCase(updateExamResult.fulfilled, (state, action) => {
        if (state.consultation) {
          const exam = state.consultation.exams.find(e => e.id === action.payload.examId);
          if (exam) {
            const resultIndex = exam.resultados.findIndex(r => r.id === action.payload.result.id);
            if (resultIndex !== -1) {
              exam.resultados[resultIndex] = action.payload.result;
            }
          }
        }
      })
      // Save vital signs
      .addCase(saveVitalSigns.fulfilled, (state, action) => {
        if (state.consultation) {
          state.consultation.vitalSigns = action.payload;
        }
      })
      // Save prescription
      .addCase(savePrescription.fulfilled, (state, action) => {
        if (state.consultation) {
          if (!state.consultation.prescription) {
            state.consultation.prescription = { ...action.payload, items: [] };
          } else {
            state.consultation.prescription = {
              ...state.consultation.prescription,
              ...action.payload
            };
          }
        }
      })
      // Create prescription item
      .addCase(createPrescriptionItem.fulfilled, (state, action) => {
        if (state.consultation?.prescription) {
          if (!state.consultation.prescription.items) {
            state.consultation.prescription.items = [];
          }
          state.consultation.prescription.items.push(action.payload);
        }
      })
      // Update prescription item
      .addCase(updatePrescriptionItem.fulfilled, (state, action) => {
        if (state.consultation?.prescription?.items) {
          const index = state.consultation.prescription.items.findIndex(
            item => item.id === action.payload.id
          );
          if (index !== -1) {
            state.consultation.prescription.items[index] = action.payload;
          }
        }
      })
      // Create diagnosis
      .addCase(createDiagnosis.fulfilled, (state, action) => {
        if (state.consultation) {
          state.consultation.diagnoses.push(action.payload);
        }
      })
      // Update diagnosis
      .addCase(updateDiagnosis.fulfilled, (state, action) => {
        if (state.consultation) {
          const index = state.consultation.diagnoses.findIndex(d => d.id === action.payload.id);
          if (index !== -1) {
            state.consultation.diagnoses[index] = action.payload;
          }
        }
      });
  }
});

export const { clearConsultationDetail } = consultationDetailSlice.actions;
export default consultationDetailSlice.reducer;