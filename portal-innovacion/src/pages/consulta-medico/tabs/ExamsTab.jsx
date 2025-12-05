import React from 'react';
import { FaEdit, FaTrash, FaPlus, FaExclamationTriangle } from 'react-icons/fa';

const EmptyState = ({ message, onAdd }) => (
  <div className="empty-state-tab">
    <FaExclamationTriangle className="empty-icon" />
    <p>{message}</p>
    <button className="btn-add-primary" onClick={onAdd}>
      <FaPlus /> Agregar
    </button>
  </div>
);

const ExamsTab = ({ 
  exams, 
  onAddExam, 
  onEditExam, 
  onDeleteExam, 
  onAddResult, 
  onEditResult, 
  onDeleteResult 
}) => {
  return (
    <div className="tab-content">
        <div className="content-header">
            <h3>Exámenes Médicos</h3>
            <button className="btn-action add" onClick={onAddExam}>
            <FaPlus /> Nuevo Examen
            </button>
        </div>
        
        {exams.length === 0 ? (
            <EmptyState 
            message="No hay exámenes registrados" 
            onAdd={onAddExam} 
            />
        ) : (
            <div className="items-list">
            {exams.map(exam => (
                <div key={exam.id} className="exam-card">
                <div className="exam-header">
                    <h4>{exam.tipo}</h4>
                    <div className="header-actions">
                    <button 
                        className="btn-icon edit" 
                        onClick={() => onEditExam(exam)}
                    >
                        <FaEdit />
                    </button>
                    <button 
                        className="btn-icon delete" 
                        onClick={() => onDeleteExam(exam.id)}
                    >
                        <FaTrash />
                    </button>
                    </div>
                </div>
                
                <p className="exam-indication">{exam.indicacion}</p>
                
                <div className="exam-results">
                    <div className="results-header">
                    <strong>Resultados ({exam.resultados?.length || 0})</strong>
                    <button 
                        className="btn-small" 
                        onClick={() => onAddResult(exam.id)}
                    >
                        <FaPlus /> Agregar Resultado
                    </button>
                    </div>
                    
                    {exam.resultados && exam.resultados.length > 0 ? (
                    exam.resultados.map(result => (
                        <div key={result.id} className="result-item">
                        <div className="result-info">
                            <span className="result-date">{result.fecha_resultado}</span>
                            <p><strong>Informe:</strong> {result.informe}</p>
                            <p><strong>Hallazgo:</strong> {result.hallazgo}</p>
                        </div>
                        <div className="result-actions">
                            <button 
                            className="btn-icon edit" 
                            onClick={() => onEditResult(result, exam.id)}
                            >
                            <FaEdit />
                            </button>
                            <button 
                            className="btn-icon delete"
                            onClick={() => onDeleteResult(exam.id, result.id)}
                            >
                            <FaTrash />
                            </button>
                        </div>
                        </div>
                    ))
                    ) : (
                        <p className="no-results">No hay resultados registrados</p>
                    )}
                </div>
            </div>
            ))}
        </div>
        )}
    </div>
  );
}; export default ExamsTab;