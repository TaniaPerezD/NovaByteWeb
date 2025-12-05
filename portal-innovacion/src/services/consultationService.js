// src/services/consultationService.js

import { supabase } from "../services/supabaseClient";

export const consultationService = {
  // Obtener datos completos de una consulta específica
  async getConsultationDetails(consultaId, pacienteId) {
    try {
      // 1. Obtener la consulta principal con información del médico
      const { data: consulta, error: consultaError } = await supabase
        .from('consulta')
        .select(`
          *,
          medico:medico_id (
            nombre,
            apellidos,
            especialidad
          ),
          cita:cita_id (
            fecha_hora,
            estado,
            tipo_cita
          )
        `)
        .eq('id', consultaId)
        .eq('paciente_id', pacienteId)
        .single();

      if (consultaError) throw consultaError;
      if (!consulta) throw new Error('Consulta no encontrada');

      // 2. Obtener exámenes con sus resultados
      const { data: exams, error: examsError } = await supabase
        .from('examen')
        .select(`
          id,
          tipo,
          indicacion,
          created_at,
          resultados:resultado_examen (
            id,
            informe,
            hallazgos,
            fecha_resultado,
            adjunto_url
          )
        `)
        .eq('consulta_id', consultaId);

      if (examsError) throw examsError;

      // 3. Obtener signos vitales
      const { data: vitalSigns, error: vitalsError } = await supabase
        .from('signos_vitales')
        .select('*')
        .eq('consulta_id', consultaId)
        .single();

      // No lanzar error si no hay signos vitales (pueden no existir)

      // 4. Obtener receta con sus items
      const { data: receta, error: recetaError } = await supabase
        .from('receta')
        .select(`
          id,
          indicaciones_generales,
          created_at,
          items:receta_item (
            id,
            medicamento,
            via,
            dosis,
            frecuencia,
            duracion
          )
        `)
        .eq('consulta_id', consultaId)
        .single();

      // No lanzar error si no hay receta

      // 5. Obtener diagnósticos
      const { data: diagnoses, error: diagnosesError } = await supabase
        .from('diagnostico')
        .select('*')
        .eq('consulta_id', consultaId);

      if (diagnosesError) throw diagnosesError;

      // Retornar todo estructurado
      return {
        consulta: {
          id: consulta.id,
          motivo: consulta.motivo,
          anamnesis: consulta.anamnesis,
          examen_fisico: consulta.examen_fisico,
          plan: consulta.plan,
          observaciones: consulta.observaciones,
          fecha: consulta.created_at,
          medico: consulta.medico,
          cita: consulta.cita
        },
        exams: exams || [],
        vitalSigns: vitalSigns || null,
        prescription: receta ? {
          id: receta.id,
          fecha: receta.created_at,
          indicaciones_generales: receta.indicaciones_generales,
          items: receta.items || []
        } : null,
        diagnoses: diagnoses || []
      };
    } catch (error) {
      console.error('Error al obtener detalles de consulta:', error);
      throw error;
    }
  },

  // Obtener alergias del paciente
  async getPatientAllergies(pacienteId) {
    const { data, error } = await supabase
      .from('alergia')
      .select('*')
      .eq('paciente_id', pacienteId);

    if (error) throw error;
    return data || [];
  },

  // Obtener antecedentes del paciente
  async getPatientBackgrounds(pacienteId) {
    const { data, error } = await supabase
      .from('antecedente')
      .select('*')
      .eq('paciente_id', pacienteId);

    if (error) throw error;
    return data || [];
  },

  // Obtener todas las consultas de un paciente (para determinar primera consulta)
  async getAllPatientConsultations(pacienteId) {
    const { data, error } = await supabase
      .from('consulta')
      .select('id, created_at')
      .eq('paciente_id', pacienteId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Actualizar consulta
  async updateConsultation(consultaId, data) {
    const { error } = await supabase
      .from('consulta')
      .update({
        motivo: data.motivo,
        anamnesis: data.anamnesis,
        examen_fisico: data.examen_fisico,
        plan: data.plan,
        observaciones: data.observaciones
      })
      .eq('id', consultaId);

    if (error) throw error;
    return true;
  },

  // Eliminar consulta
  async deleteConsultation(consultaId) {
    const { error } = await supabase
      .from('consulta')
      .delete()
      .eq('id', consultaId);

    if (error) throw error;
    return true;
  },

  // === EXÁMENES ===
  async createExam(consultaId, examData) {
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
    return data;
  },

  async updateExam(examId, examData) {
    const { error } = await supabase
      .from('examen')
      .update({
        tipo: examData.tipo,
        indicacion: examData.indicacion
      })
      .eq('id', examId);

    if (error) throw error;
    return true;
  },

  async deleteExam(examId) {
    const { error } = await supabase
      .from('examen')
      .delete()
      .eq('id', examId);

    if (error) throw error;
    return true;
  },

  // === RESULTADOS DE EXÁMENES ===
  async createExamResult(examId, resultData) {
    const { data, error } = await supabase
      .from('resultado_examen')
      .insert({
        examen_id: examId,
        informe: resultData.informe,
        hallazgos: resultData.hallazgo ? { hallazgo: resultData.hallazgo } : null,
        fecha_resultado: resultData.fecha_resultado
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateExamResult(resultId, resultData) {
    const { error } = await supabase
      .from('resultado_examen')
      .update({
        informe: resultData.informe,
        hallazgos: resultData.hallazgo ? { hallazgo: resultData.hallazgo } : null,
        fecha_resultado: resultData.fecha_resultado
      })
      .eq('id', resultId);

    if (error) throw error;
    return true;
  },

  async deleteExamResult(resultId) {
    const { error } = await supabase
      .from('resultado_examen')
      .delete()
      .eq('id', resultId);

    if (error) throw error;
    return true;
  },

  // === SIGNOS VITALES ===
  async createVitalSigns(consultaId, vitalSignsData) {
    const { data, error } = await supabase
      .from('signos_vitales')
      .insert({
        consulta_id: consultaId,
        ...vitalSignsData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateVitalSigns(vitalSignsId, vitalSignsData) {
    const { error } = await supabase
      .from('signos_vitales')
      .update(vitalSignsData)
      .eq('id', vitalSignsId);

    if (error) throw error;
    return true;
  },

  async deleteVitalSigns(consultaId) {
    const { error } = await supabase
      .from('signos_vitales')
      .delete()
      .eq('consulta_id', consultaId);

    if (error) throw error;
    return true;
  },

  // === RECETA MÉDICA ===
  async createPrescription(consultaId, prescriptionData) {
    const { data, error } = await supabase
      .from('receta')
      .insert({
        consulta_id: consultaId,
        indicaciones_generales: prescriptionData.indicaciones_generales
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePrescription(prescriptionId, prescriptionData) {
    const { error } = await supabase
      .from('receta')
      .update({
        indicaciones_generales: prescriptionData.indicaciones_generales
      })
      .eq('id', prescriptionId);

    if (error) throw error;
    return true;
  },

  async deletePrescription(prescriptionId) {
    const { error } = await supabase
      .from('receta')
      .delete()
      .eq('id', prescriptionId);

    if (error) throw error;
    return true;
  },

  // === ITEMS DE RECETA ===
  async createPrescriptionItem(recetaId, itemData) {
    const { data, error } = await supabase
      .from('receta_item')
      .insert({
        receta_id: recetaId,
        ...itemData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePrescriptionItem(itemId, itemData) {
    const { error } = await supabase
      .from('receta_item')
      .update(itemData)
      .eq('id', itemId);

    if (error) throw error;
    return true;
  },

  async deletePrescriptionItem(itemId) {
    const { error } = await supabase
      .from('receta_item')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
    return true;
  },

  // === DIAGNÓSTICOS ===
  async createDiagnosis(consultaId, diagnosisData) {
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
    return data;
  },

  async updateDiagnosis(diagnosisId, diagnosisData) {
    const { error } = await supabase
      .from('diagnostico')
      .update({
        codigo: diagnosisData.codigo,
        descripcion: diagnosisData.descripcion,
        principal: diagnosisData.principal
      })
      .eq('id', diagnosisId);

    if (error) throw error;
    return true;
  },

  async deleteDiagnosis(diagnosisId) {
    const { error } = await supabase
      .from('diagnostico')
      .delete()
      .eq('id', diagnosisId);

    if (error) throw error;
    return true;
  }
};