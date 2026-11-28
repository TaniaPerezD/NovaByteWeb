import { gql } from '@apollo/client';

export const GENERAR_HISTORIA_CLINICA_PDF = gql`
  mutation GenerarHistoriaClinicaPDF($filtro: FiltroHistoriaClinica!) {
    generarHistoriaClinicaPDF(filtro: $filtro) {
      fileName
      downloadUrl
      formato
      generado_en
      metadata {
        total_registros
        filtros_aplicados
        periodo
        tipo_reporte
      }
    }
  }
`;

export const GENERAR_AGENDA_MEDICO_PDF = gql`
  mutation GenerarAgendaMedicoPDF($filtro: FiltroAgendaMedico!) {
    generarAgendaMedicoPDF(filtro: $filtro) {
      fileName
      downloadUrl
      formato
      generado_en
      metadata {
        total_registros
        filtros_aplicados
        periodo
        tipo_reporte
      }
    }
  }
`;

export const GENERAR_DASHBOARD_ESTADISTICAS_PDF = gql`
  mutation GenerarDashboardEstadisticasPDF($filtro: FiltroEstadisticasGenerales) {
    generarDashboardEstadisticasPDF(filtro: $filtro) {
      fileName
      downloadUrl
      formato
      generado_en
      metadata {
        total_registros
        filtros_aplicados
        periodo
        tipo_reporte
      }
    }
  }
`;

export const GENERAR_DESEMPENO_MEDICOS_PDF = gql`
  mutation GenerarDesempenoMedicosPDF($filtro: FiltroDesempenoMedico) {
    generarDesempenoMedicosPDF(filtro: $filtro) {
      fileName
      downloadUrl
      formato
      generado_en
      metadata {
        total_registros
        filtros_aplicados
        periodo
        tipo_reporte
      }
    }
  }
`;

export const GENERAR_DESEMPENO_MEDICOS_EXCEL = gql`
  mutation GenerarDesempenoMedicosExcel($filtro: FiltroDesempenoMedico) {
    generarDesempenoMedicosExcel(filtro: $filtro) {
      fileName
      downloadUrl
      formato
      generado_en
      metadata {
        total_registros
        filtros_aplicados
        periodo
        tipo_reporte
      }
    }
  }
`;

// Queries para obtener datos
export const OBTENER_ESTADISTICAS_MEDICO = gql`
  query ObtenerEstadisticasMedico($filtro: FiltroDesempenoMedico) {
    estadisticasMedico(filtro: $filtro) {
      medico_id
      nombre_medico
      total_consultas
      pacientes_unicos
      promedio_consultas_dia
      diagnosticos_frecuentes {
        descripcion
        cantidad
      }
    }
  }
`;

export const OBTENER_ESTADISTICAS_GENERALES = gql`
  query ObtenerEstadisticasGenerales($filtro: FiltroEstadisticasGenerales) {
    estadisticasGenerales(filtro: $filtro) {
      total_medicos_activos
      total_pacientes
      total_consultas
      consultas_mes_actual
      citas_programadas
      citas_completadas
    }
  }
`;

export const LISTAR_CONSULTAS = gql`
  query ListarConsultas($filtro: FiltroConsultas) {
    listarConsultas(filtro: $filtro) {
      id
      fecha
      motivo
      diagnosticos {
        id
        codigo
        descripcion
        principal
      }
    }
  }
`;