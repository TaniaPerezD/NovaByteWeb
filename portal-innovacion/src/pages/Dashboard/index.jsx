import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaUserMd, FaUsers, FaClipboardCheck, FaStar, FaClock, FaComments, FaChartLine } from 'react-icons/fa';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LoadingScreen from './LoadingScreen';
import KPICard from './KPICard';
import DateFilter from './DateFilter';
import ChartCard from './ChartCard';
import { fetchDashboardKPIs, setFechaInicio, setFechaFin } from '../../redux/dashboard/dashboardSlice';
import Swal from "sweetalert2";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { data, loading, error, filters } = useSelector((state) => state.dashboard);
  const { fechaInicio, fechaFin } = filters;

  useEffect(() => {

    if (new Date(fechaInicio) > new Date(fechaFin)) {
      Swal.fire({
        icon: "error",
        title: "Fechas inválidas",
        text: "La fecha de inicio no puede ser mayor que la fecha fin."
      });
      return;
    }

    dispatch(fetchDashboardKPIs({ fechaInicio, fechaFin }));
  }, [dispatch, fechaInicio, fechaFin]);

  const handleSearch = () => {

    if (new Date(fechaInicio) > new Date(fechaFin)) {
      Swal.fire({
        icon: "error",
        title: "Fechas inválidas",
        text: "La fecha de inicio no puede ser mayor que la fecha fin."
      });
      return;
    }
    
    dispatch(fetchDashboardKPIs({ fechaInicio, fechaFin }));
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="medical-dashboard">
        <div className="dashboard-container">
          <div className="error-message" style={{
            padding: '20px',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            color: '#c33',
            textAlign: 'center'
          }}>
            <h3>Error al cargar los datos</h3>
            <p>{error}</p>
            <button 
              onClick={handleSearch}
              style={{
                marginTop: '10px',
                padding: '10px 20px',
                backgroundColor: '#E79796',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="medical-dashboard">
        <div className="dashboard-container">
          <p style={{ textAlign: 'center', padding: '20px' }}>No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  const {
    kpis_generales = {},
    metricas_satisfaccion = {},
    citas_por_estado = [],
    citas_por_tipo = [],
    tendencia_citas = [],
    comentarios_recientes = []
  } = data;

  const COLORS = ['#E79796', '#E6A4B4', '#F4B7B2', '#FAD4D4', '#FBE5E5'];

  return (
    <div className="medical-dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="dashboard-header_info">
            <h1 className="dashboard-header_title">Dashboard Médico</h1>
            <p className="dashboard-header_subtitle">Métricas y estadísticas del período</p>
          </div>
          <DateFilter 
            startDate={fechaInicio}
            endDate={fechaFin}
            onStartDateChange={(date) => dispatch(setFechaInicio(date))}
            onEndDateChange={(date) => dispatch(setFechaFin(date))}
            onSearch={handleSearch}
          />
        </div>

        {/* KPIs Grid */}
        <div className="kpis-grid">
          <KPICard
            icon={FaClipboardCheck}
            title="Total Citas"
            value={kpis_generales.total_citas || 0}
            subtitle="En el período"
            colorClass="rose"
          />
          <KPICard
            icon={FaUsers}
            title="Pacientes"
            value={kpis_generales.total_pacientes_activos || 0}
            subtitle="Activos"
            colorClass="purple"
          />
          <KPICard
            icon={FaUserMd}
            title="Médicos"
            value={kpis_generales.total_medicos_activos || 0}
            subtitle="Atendiendo"
            colorClass="orange"
          />
          <KPICard
            icon={FaChartLine}
            title="Completitud"
            value={`${kpis_generales.tasa_completitud_citas || 0}%`}
            subtitle="Citas completadas"
            colorClass="yellow"
          />
          <KPICard
            icon={FaStar}
            title="Satisfacción"
            value={metricas_satisfaccion.satisfaccion_general?.promedio?.toFixed(1) || '0.0'}
            subtitle="Sobre 100"
            colorClass="pink"
          />
          <KPICard
            icon={FaClock}
            title="Actitud"
            value={metricas_satisfaccion.actitud_medico?.promedio?.toFixed(1) || '0.0'}
            subtitle="Sobre 10"
            colorClass="theme"
          />
        </div>

        {/* Charts Grid - Primera fila */}
        {(citas_por_estado.length > 0 || citas_por_tipo.length > 0) && (
          <div className="charts-grid">
            {citas_por_estado.length > 0 && (
              <ChartCard title="Estado de Citas">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={citas_por_estado}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="cantidad"
                      nameKey="estado"
                    >
                      {citas_por_estado.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--it-random-card-bg)', 
                        border: '1px solid var(--it-random-border)',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {citas_por_tipo.length > 0 && (
              <ChartCard title="Tipo de Citas">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={citas_por_tipo}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="cantidad"
                      nameKey="tipo"
                    >
                      {citas_por_tipo.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--it-random-card-bg)', 
                        border: '1px solid var(--it-random-border)',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>
        )}

        {/* Tendencia */}
        {tendencia_citas.length > 0 && (
          <ChartCard title="Tendencia de Citas" fullWidth>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={tendencia_citas}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--it-grey-3)" />
                <XAxis dataKey="fecha" stroke="var(--it-text-body)" style={{ fontSize: '12px' }} />
                <YAxis stroke="var(--it-text-body)" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--it-random-card-bg)', 
                    border: '1px solid var(--it-random-border)',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#E79796" strokeWidth={2} name="Total" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="completadas" stroke="#B84E58" strokeWidth={2} name="Completadas" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="canceladas" stroke="#F4B7B2" strokeWidth={2} name="Canceladas" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Charts Grid - Segunda fila */}
        {(metricas_satisfaccion.satisfaccion_general?.distribucion?.length > 0 || 
          metricas_satisfaccion.tiempo_espera?.length > 0) && (
          <div className="charts-grid">
            {metricas_satisfaccion.satisfaccion_general?.distribucion?.length > 0 && (
              <ChartCard title="Satisfacción General (0-100)">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={metricas_satisfaccion.satisfaccion_general.distribucion}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--it-grey-3)" />
                    <XAxis dataKey="rango" stroke="var(--it-text-body)" style={{ fontSize: '12px' }} />
                    <YAxis stroke="var(--it-text-body)" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--it-random-card-bg)', 
                        border: '1px solid var(--it-random-border)',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="cantidad" fill="#E79796" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {metricas_satisfaccion.tiempo_espera?.length > 0 && (
              <ChartCard title="Tiempo de Espera">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={metricas_satisfaccion.tiempo_espera}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--it-grey-3)" />
                    <XAxis dataKey="rango" stroke="var(--it-text-body)" style={{ fontSize: '12px' }} />
                    <YAxis stroke="var(--it-text-body)" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--it-random-card-bg)', 
                        border: '1px solid var(--it-random-border)',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="cantidad" fill="#E6A4B4" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>
        )}

        {/* Charts Grid - Tercera fila */}
        {(metricas_satisfaccion.actitud_medico?.distribucion?.length > 0 || 
          metricas_satisfaccion.comprension_explicacion?.length > 0) && (
          <div className="charts-grid">
            {metricas_satisfaccion.actitud_medico?.distribucion?.length > 0 && (
              <ChartCard title="Actitud del Médico (0-10)">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={metricas_satisfaccion.actitud_medico.distribucion}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--it-grey-3)" />
                    <XAxis dataKey="puntuacion" stroke="var(--it-text-body)" style={{ fontSize: '12px' }} />
                    <YAxis stroke="var(--it-text-body)" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--it-random-card-bg)', 
                        border: '1px solid var(--it-random-border)',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="cantidad" fill="#E091A2" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {metricas_satisfaccion.comprension_explicacion?.length > 0 && (
              <ChartCard title="Comprensión de Explicación">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={metricas_satisfaccion.comprension_explicacion}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--it-grey-3)" />
                    <XAxis dataKey="nivel" stroke="var(--it-text-body)" style={{ fontSize: '12px' }} />
                    <YAxis stroke="var(--it-text-body)" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--it-random-card-bg)', 
                        border: '1px solid var(--it-random-border)',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="cantidad" fill="#F4B7B2" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>
        )}

        {/* Comentarios */}
        {comentarios_recientes.length > 0 && (
          <div className="comments-section">
            <h3 className="comments-section_title">
              <FaComments size={18} />
              Comentarios Recientes
            </h3>
            <div className="comments-list">
              {comentarios_recientes.map((comment, index) => (
                <div key={index} className="comment-item">
                  <div className="comment-item_header">
                    <span className="comment-item_date">
                      {new Date(comment.fecha).toLocaleDateString('es-ES', { 
                        day: '2-digit', 
                        month: 'short', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    <span className="comment-item_id">Cita #{comment.cita_id?.substring(0, 8)}</span>
                  </div>
                  <p className="comment-item_text">{comment.comentario}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Stats */}
        {metricas_satisfaccion && Object.keys(metricas_satisfaccion).length > 0 && (
          <div className="dashboard-footer">
            <div className="footer-stats">
              <div className="footer-stat">
                <div className="footer-stat_icon footer-stat_icon--rose">
                  <FaClipboardCheck size={20} />
                </div>
                <div className="footer-stat_content">
                  <p className="footer-stat_label">Total Encuestas</p>
                  <p className="footer-stat_value">{metricas_satisfaccion.total_encuestas || 0}</p>
                </div>
              </div>
              <div className="footer-stat">
                <div className="footer-stat_icon footer-stat_icon--purple">
                  <FaUsers size={20} />
                </div>
                <div className="footer-stat_content">
                  <p className="footer-stat_label">Pacientes Nuevos</p>
                  <p className="footer-stat_value">
                    {metricas_satisfaccion.primera_visita?.porcentaje_nuevos?.toFixed(1) || '0.0'}%
                  </p>
                </div>
              </div>
              <div className="footer-stat">
                <div className="footer-stat_icon footer-stat_icon--orange">
                  <FaClock size={20} />
                </div>
                <div className="footer-stat_content">
                  <p className="footer-stat_label">Consultas Totales</p>
                  <p className="footer-stat_value">{kpis_generales.total_consultas || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; export default Dashboard;