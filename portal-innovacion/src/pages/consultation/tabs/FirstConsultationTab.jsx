import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

const FirstConsultationTab = ({ firstConsultation }) => {
  if (!firstConsultation) {
    return (
      <div className="tab-content">
        <div className="empty-state">
          <FaExclamationTriangle className="empty-icon" />
          <p>No se encontró información de la primera consulta</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content">
      {/* Sección Consulta */}
      <div className="first-consultation-section">
        <h3 className="section-title">Datos de la Consulta</h3>
        <div className="consultation-data">
          <div className="data-item">
            <strong>Motivo:</strong> 
            <p>{firstConsultation.motivo}</p>
          </div>
          <div className="data-item">
            <strong>Anamnesis:</strong> 
            <p>{firstConsultation.anamnesis}</p>
          </div>
          <div className="data-item">
            <strong>Examen Físico:</strong> 
            <p>{firstConsultation.examen_fisico}</p>
          </div>
          <div className="data-item">
            <strong>Plan de Tratamiento:</strong> 
            <p>{firstConsultation.plan}</p>
          </div>
          {firstConsultation.observaciones && (
            <div className="data-item">
              <strong>Observaciones:</strong> 
              <p>{firstConsultation.observaciones}</p>
            </div>
          )}
          <div className="data-item">
            <strong>Fecha:</strong> 
            <p>{firstConsultation.fecha}</p>
          </div>
        </div>
      </div>

      {/* Sección Exámenes */}
      {firstConsultation.exams && firstConsultation.exams.length > 0 && (
        <div className="first-consultation-section">
          <h3 className="section-title">Exámenes Médicos</h3>
          <div className="items-list">
            {firstConsultation.exams.map(exam => (
              <div key={exam.id} className="exam-card">
                <div className="exam-header">
                  <h4>{exam.tipo}</h4>
                </div>
                <p className="exam-indication">{exam.indicacion}</p>
                
                {exam.resultados && exam.resultados.length > 0 && (
                  <div className="exam-results">
                    <div className="results-header">
                      <strong>Resultados ({exam.resultados.length})</strong>
                    </div>
                    {exam.resultados.map(result => (
                      <div key={result.id} className="result-item">
                        <div className="result-info">
                          <span className="result-date">{result.fecha_resultado}</span>
                          <p><strong>Informe:</strong> {result.informe}</p>
                          <p><strong>Hallazgo:</strong> {result.hallazgo}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sección Signos Vitales */}
      {firstConsultation.vitalSigns && (
        <div className="first-consultation-section">
          <h3 className="section-title">Signos Vitales</h3>
          <div className="vital-signs-grid">
            <div className="vital-item">
              <span className="vital-label">Presión Arterial:</span>
              <span className="vital-value">
                {firstConsultation.vitalSigns.presion_sistolica}/{firstConsultation.vitalSigns.presion_diastolica} mmHg
              </span>
            </div>
            <div className="vital-item">
              <span className="vital-label">Frecuencia Cardíaca:</span>
              <span className="vital-value">{firstConsultation.vitalSigns.frecuencia_cardiaca} lpm</span>
            </div>
            <div className="vital-item">
              <span className="vital-label">Temperatura:</span>
              <span className="vital-value">{firstConsultation.vitalSigns.temperatura} °C</span>
            </div>
            <div className="vital-item">
              <span className="vital-label">Saturación O₂:</span>
              <span className="vital-value">{firstConsultation.vitalSigns.saturacion_oxigeno}%</span>
            </div>
            <div className="vital-item">
              <span className="vital-label">Peso:</span>
              <span className="vital-value">{firstConsultation.vitalSigns.peso_kg} kg</span>
            </div>
            <div className="vital-item">
              <span className="vital-label">Talla:</span>
              <span className="vital-value">{firstConsultation.vitalSigns.talla_cm} cm</span>
            </div>
          </div>
        </div>
      )}

      {/* Sección Receta */}
      {firstConsultation.prescription && (
        <div className="first-consultation-section">
          <h3 className="section-title">Receta Médica</h3>
          <div className="prescription-content">
            <div className="prescription-header-info">
              <p><strong>Fecha:</strong> {firstConsultation.prescription.fecha}</p>
              <p><strong>Indicaciones Generales:</strong> {firstConsultation.prescription.indicaciones_generales}</p>
            </div>
            
            {firstConsultation.prescription.items && firstConsultation.prescription.items.length > 0 && (
              <div className="prescription-items">
                <h4>Medicamentos</h4>
                <div className="medications-list">
                  {firstConsultation.prescription.items.map(item => (
                    <div key={item.id} className="medication-card">
                      <div className="medication-header">
                        <h5>{item.medicamento}</h5>
                      </div>
                      <div className="medication-details">
                        <span><strong>Vía:</strong> {item.via}</span>
                        <span><strong>Dosis:</strong> {item.dosis}</span>
                        <span><strong>Frecuencia:</strong> {item.frecuencia}</span>
                        <span><strong>Duración:</strong> {item.duracion}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sección Diagnósticos */}
      {firstConsultation.diagnoses && firstConsultation.diagnoses.length > 0 && (
        <div className="first-consultation-section">
          <h3 className="section-title">Diagnósticos</h3>
          <div className="diagnosis-list">
            {firstConsultation.diagnoses.map(diag => (
              <div 
                key={diag.id} 
                className={`diagnosis-card ${diag.principal ? 'principal' : ''}`}
              >
                <div className="diagnosis-header">
                  <div className="diagnosis-info">
                    <span className="diagnosis-code">{diag.codigo}</span>
                    {diag.principal && (
                      <span className="principal-badge">Principal</span>
                    )}
                  </div>
                </div>
                <div className="diagnosis-description">
                  <span className="description-label">
                    <strong>Descripción:</strong>
                  </span>
                  <span className="diagnosis-description-text">
                    {diag.descripcion}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; export default FirstConsultationTab;