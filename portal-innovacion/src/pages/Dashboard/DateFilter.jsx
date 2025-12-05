import React from 'react';
import { FaSearch, FaCalendarAlt } from 'react-icons/fa';

const DateFilter = ({ startDate, endDate, onStartDateChange, onEndDateChange, onSearch }) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="date-filter">
      <div className="date-filter_inputs">
        <div className="date-filter_input-group">
          <label htmlFor="start-date" className="date-filter_label">
            <FaCalendarAlt size={14} />
            Fecha Inicio
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="date-filter_input"
          />
        </div>
        
        <div className="date-filter_input-group">
          <label htmlFor="end-date" className="date-filter_label">
            <FaCalendarAlt size={14} />
            Fecha Fin
          </label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="date-filter_input"
          />
        </div>
      </div>
      
      <button 
        onClick={onSearch}
        className="date-filter_search-btn"
        title="Buscar"
      >
        <FaSearch size={16} />
        <span>Buscar</span>
      </button>
    </div>
  );
}; export default DateFilter;