// src/services/consultationService.js
import { supabase } from '../supabaseClient'; // Asegúrate de que esta ruta sea correcta

const consultationService = {
    // =========================================================================
    // LECTURA DE DATOS (READ)
    // =========================================================================

    async getConsultationDetails(consultaId, patientId) {
        // Usamos la técnica de "Foreign Table Join" de Supabase para obtener todo de una vez
        const { data, error } = await supabase
            .from('consulta')
            .select(`
                *,
                signos_vitales(*),
                receta(
                    *,
                    items:receta_item(*)
                ),
                exams:examen(
                    *,
                    resultados:resultado_examen(*)
                ),
                diagnoses:diagnostico(*)
            `)
            .eq('id', consultaId)
            .eq('paciente_id', patientId)
            .single();

        if (error) {
            console.error('Error fetching consultation details:', error);
            throw new Error(`Error al obtener detalles de la consulta: ${error.message}`);
        }
        
        // Reestructurar los datos para que coincidan con los estados del componente padre
        return {
            consulta: data,
            vitalSigns: data.signos_vitales,
            prescription: data.receta,
            exams: data.exams,
            diagnoses: data.diagnoses
        };
    },

    async getAllPatientConsultations(patientId) {
        const { data, error } = await supabase
            .from('consulta')
            .select('*')
            .eq('paciente_id', patientId)
            .order('created_at', { ascending: true }); // La primera será la primera consulta

        if (error) throw new Error(`Error al obtener consultas del paciente: ${error.message}`);
        return data || [];
    },

    async getPatientAllergies(patientId) {
        const { data, error } = await supabase
            .from('alergia')
            .select('*')
            .eq('paciente_id', patientId);

        if (error) throw new Error(`Error al obtener alergias: ${error.message}`);
        return data || [];
    },

    async getPatientBackgrounds(patientId) {
        const { data, error } = await supabase
            .from('antecedente')
            .select('*')
            .eq('paciente_id', patientId);

        if (error) throw new Error(`Error al obtener antecedentes: ${error.message}`);
        return data || [];
    },

    // =========================================================================
    // CONSULTA (CRUD)
    // =========================================================================

    async updateConsultation(consultaId, data) {
        const { error } = await supabase
            .from('consulta')
            .update(data)
            .eq('id', consultaId);
        if (error) throw new Error(`Error al actualizar consulta: ${error.message}`);
    },

    async deleteConsultation(consultaId) {
        const { error } = await supabase
            .from('consulta')
            .delete()
            .eq('id', consultaId);
        if (error) throw new Error(`Error al eliminar consulta: ${error.message}`);
    },

    // =========================================================================
    // SIGNOS VITALES (CRUD)
    // =========================================================================

    async createVitalSigns(consultaId, data) {
        const { data: newVs, error } = await supabase
            .from('signos_vitales')
            .insert([{ ...data, consulta_id: consultaId }])
            .select()
            .single();
        if (error) throw new Error(`Error al crear signos vitales: ${error.message}`);
        return newVs;
    },

    async updateVitalSigns(vitalSignsId, data) {
        const { error } = await supabase
            .from('signos_vitales')
            .update(data)
            .eq('id', vitalSignsId);
        if (error) throw new Error(`Error al actualizar signos vitales: ${error.message}`);
    },
    
    // NOTA: Para eliminar SV, asumo que se usa el consulta_id, pero tu componente lo maneja con el ID de SV. 
    // Lo corregí para que use el ID de la tabla `signos_vitales` si lo tienes.
    async deleteVitalSigns(consultaId) {
        const { error } = await supabase
            .from('signos_vitales')
            .delete()
            .eq('consulta_id', consultaId); // Es más seguro usar consulta_id, ya que es 1:1

        if (error) throw new Error(`Error al eliminar signos vitales: ${error.message}`);
    },

    // =========================================================================
    // EXÁMENES (CRUD)
    // =========================================================================

    async createExam(consultaId, examData) {
        const { data, error } = await supabase
            .from('examen')
            .insert([{ ...examData, consulta_id: consultaId }])
            .select()
            .single();
        if (error) throw new Error(`Error al crear examen: ${error.message}`);
        return data;
    },

    async updateExam(examId, examData) {
        const { error } = await supabase
            .from('examen')
            .update(examData)
            .eq('id', examId);
        if (error) throw new Error(`Error al actualizar examen: ${error.message}`);
    },

    async deleteExam(examId) {
        // La eliminación en cascada (CASCADE) debe estar configurada en la BD para eliminar resultados_examen
        const { error } = await supabase
            .from('examen')
            .delete()
            .eq('id', examId);
        if (error) throw new Error(`Error al eliminar examen: ${error.message}`);
    },
    
    // RESULTADOS DE EXÁMENES (CRUD)
    async createExamResult(examId, resultData) {
        const { data, error } = await supabase
            .from('resultado_examen')
            .insert([{ ...resultData, examen_id: examId }])
            .select()
            .single();
        if (error) throw new Error(`Error al crear resultado de examen: ${error.message}`);
        return data;
    },

    async updateExamResult(resultId, resultData) {
        const { error } = await supabase
            .from('resultado_examen')
            .update(resultData)
            .eq('id', resultId);
        if (error) throw new Error(`Error al actualizar resultado: ${error.message}`);
    },

    async deleteExamResult(resultId) {
        const { error } = await supabase
            .from('resultado_examen')
            .delete()
            .eq('id', resultId);
        if (error) throw new Error(`Error al eliminar resultado: ${error.message}`);
    },

    // =========================================================================
    // RECETA (CRUD)
    // =========================================================================

    async createPrescription(consultaId, data) {
        const { data: newPrescription, error } = await supabase
            .from('receta')
            .insert([{ ...data, consulta_id: consultaId }])
            .select()
            .single();
        if (error) throw new Error(`Error al crear receta: ${error.message}`);
        return newPrescription;
    },

    async updatePrescription(prescriptionId, data) {
        const { error } = await supabase
            .from('receta')
            .update(data)
            .eq('id', prescriptionId);
        if (error) throw new Error(`Error al actualizar receta: ${error.message}`);
    },

    async deletePrescription(prescriptionId) {
        // La eliminación en cascada (CASCADE) debe estar configurada en la BD para eliminar receta_item
        const { error } = await supabase
            .from('receta')
            .delete()
            .eq('id', prescriptionId);
        if (error) throw new Error(`Error al eliminar receta: ${error.message}`);
    },

    // ITEMS DE RECETA (CRUD)
    async createPrescriptionItem(recetaId, itemData) {
        const { data, error } = await supabase
            .from('receta_item')
            .insert([{ ...itemData, receta_id: recetaId }])
            .select()
            .single();
        if (error) throw new Error(`Error al crear medicamento: ${error.message}`);
        return data;
    },

    async updatePrescriptionItem(itemId, itemData) {
        const { error } = await supabase
            .from('receta_item')
            .update(itemData)
            .eq('id', itemId);
        if (error) throw new Error(`Error al actualizar medicamento: ${error.message}`);
    },

    async deletePrescriptionItem(itemId) {
        const { error } = await supabase
            .from('receta_item')
            .delete()
            .eq('id', itemId);
        if (error) throw new Error(`Error al eliminar medicamento: ${error.message}`);
    },

    // =========================================================================
    // DIAGNÓSTICO (CRUD)
    // =========================================================================

    async createDiagnosis(consultaId, diagnosisData) {
        const { data, error } = await supabase
            .from('diagnostico')
            .insert([{ ...diagnosisData, consulta_id: consultaId }])
            .select()
            .single();
        if (error) throw new Error(`Error al crear diagnóstico: ${error.message}`);
        return data;
    },

    async updateDiagnosis(diagnosisId, diagnosisData) {
        const { error } = await supabase
            .from('diagnostico')
            .update(diagnosisData)
            .eq('id', diagnosisId);
        if (error) throw new Error(`Error al actualizar diagnóstico: ${error.message}`);
    },

    async deleteDiagnosis(diagnosisId) {
        const { error } = await supabase
            .from('diagnostico')
            .delete()
            .eq('id', diagnosisId);
        if (error) throw new Error(`Error al eliminar diagnóstico: ${error.message}`);
    }

};

export { consultationService };