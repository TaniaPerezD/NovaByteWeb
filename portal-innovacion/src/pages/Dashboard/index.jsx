import React, { useState, useEffect } from 'react';
import { FaUserMd, FaUsers, FaClipboardCheck, FaStar, FaClock, FaComments, FaChartLine } from 'react-icons/fa';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LoadingScreen from './LoadingScreen';
import KPICard from './KPICard';
import DateFilter from './DateFilter';
import ChartCard from './ChartCard';


// Datos mock
const mockData = {
  periodo: {
    fecha_inicio: '2024-11-01',
    fecha_fin: '2024-11-30'
  },
  kpis_generales: {
    total_citas: 245,
    total_consultas: 198,
    total_pacientes_activos: 156,
    total_medicos_activos: 8,
    tasa_completitud_citas: 87.35
  },
  citas_por_estado: [
    { estado: 'Completada', cantidad: 214 },
    { estado: 'Cancelada', cantidad: 18 },
    { estado: 'Pendiente', cantidad: 13 }
  ],
  citas_por_tipo: [
    { tipo: 'Consulta General', cantidad: 128 },
    { tipo: 'Seguimiento', cantidad: 67 },
    { tipo: 'Primera Vez', cantidad: 50 }
  ],
  metricas_satisfaccion: {
    satisfaccion_general: {
      promedio: 78.5,
      total_respuestas: 187,
      distribucion: [
        { rango: '0-20', cantidad: 3 },
        { rango: '20-40', cantidad: 8 },
        { rango: '40-60', cantidad: 24 },
        { rango: '60-80', cantidad: 89 },
        { rango: '80-100', cantidad: 63 }
      ]
    },
    actitud_medico: {
      promedio: 8.7,
      total_respuestas: 187,
      distribucion: [
        { puntuacion: '5', cantidad: 2 },
        { puntuacion: '6', cantidad: 5 },
        { puntuacion: '7', cantidad: 18 },
        { puntuacion: '8', cantidad: 42 },
        { puntuacion: '9', cantidad: 67 },
        { puntuacion: '10', cantidad: 53 }
      ]
    },
    primera_visita: {
      total: 187,
      si: 48,
      no: 139,
      porcentaje_nuevos: 25.67
    },
    tiempo_espera: [
      { rango: '0-15 min', cantidad: 92 },
      { rango: '15-30 min', cantidad: 68 },
      { rango: '30-45 min', cantidad: 21 },
      { rango: '45+ min', cantidad: 6 }
    ],
    tiempo_consulta: [
      { rango: '15-30 min', cantidad: 124 },
      { rango: '30-45 min', cantidad: 48 },
      { rango: '45+ min', cantidad: 15 }
    ],
    comprension_explicacion: [
      { nivel: 'Excelente', cantidad: 98 },
      { nivel: 'Buena', cantidad: 72 },
      { nivel: 'Regular', cantidad: 15 },
      { nivel: 'Mala', cantidad: 2 }
    ],
    total_encuestas: 187
  },
  tendencia_citas: [
    { fecha: '01 Nov', total: 8, completadas: 7, canceladas: 1 },
    { fecha: '04 Nov', total: 12, completadas: 11, canceladas: 1 },
    { fecha: '07 Nov', total: 10, completadas: 9, canceladas: 1 },
    { fecha: '10 Nov', total: 9, completadas: 8, canceladas: 1 },
    { fecha: '13 Nov', total: 11, completadas: 10, canceladas: 1 },
    { fecha: '16 Nov', total: 7, completadas: 6, canceladas: 1 },
    { fecha: '19 Nov', total: 13, completadas: 11, canceladas: 2 },
    { fecha: '22 Nov', total: 9, completadas: 8, canceladas: 1 },
    { fecha: '25 Nov', total: 10, completadas: 9, canceladas: 1 },
    { fecha: '28 Nov', total: 8, completadas: 7, canceladas: 1 }
  ],
  comentarios_recientes: [
    { fecha: '2024-11-28T10:30:00', comentario: 'Excelente atención, muy profesional', cita_id: 1234 },
    { fecha: '2024-11-27T15:20:00', comentario: 'El tiempo de espera fue un poco largo', cita_id: 1235 },
    { fecha: '2024-11-26T09:15:00', comentario: 'Muy satisfecho con el servicio', cita_id: 1236 },
    { fecha: '2024-11-25T14:45:00', comentario: 'El doctor fue muy claro en sus explicaciones', cita_id: 1237 }
  ]
};


const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [startDate, setStartDate] = useState('2024-11-01');
  const [endDate, setEndDate] = useState('2024-11-30');

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 1500);
  }, [startDate, endDate]);

  if (loading) {
    return <LoadingScreen />;
  }

  const { kpis_generales, metricas_satisfaccion, citas_por_estado, citas_por_tipo, tendencia_citas, comentarios_recientes } = data;

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
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </div>

        {/* KPIs Grid */}
        <div className="kpis-grid">
          <KPICard
            icon={FaClipboardCheck}
            title="Total Citas"
            value={kpis_generales.total_citas}
            subtitle="En el período"
            colorClass="rose"
          />
          <KPICard
            icon={FaUsers}
            title="Pacientes"
            value={kpis_generales.total_pacientes_activos}
            subtitle="Activos"
            colorClass="purple"
          />
          <KPICard
            icon={FaUserMd}
            title="Médicos"
            value={kpis_generales.total_medicos_activos}
            subtitle="Atendiendo"
            colorClass="orange"
          />
          <KPICard
            icon={FaChartLine}
            title="Completitud"
            value={`${kpis_generales.tasa_completitud_citas}%`}
            subtitle="Citas completadas"
            colorClass="yellow"
          />
          <KPICard
            icon={FaStar}
            title="Satisfacción"
            value={metricas_satisfaccion.satisfaccion_general.promedio}
            subtitle="Sobre 100"
            colorClass="pink"
          />
          <KPICard
            icon={FaClock}
            title="Actitud"
            value={metricas_satisfaccion.actitud_medico.promedio}
            subtitle="Sobre 10"
            colorClass="theme"
          />
        </div>

        {/* Charts Grid - Primera fila */}
        <div className="charts-grid">
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
                  }}/>
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

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
                    borderRadius: '8px',
                  }}/>
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Tendencia */}
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

        {/* Charts Grid - Segunda fila */}
        <div className="charts-grid">
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
        </div>

        {/* Charts Grid - Tercera fila */}
        <div className="charts-grid">
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
        </div>

        {/* Comentarios */}
        <div className="comments-section">
          <h3 className="comments-section_title">
            <FaComments size={18} />
            Comentarios Recientes
          </h3>
          <div className="comments-list">
            {comentarios_recientes?.map((comment, index) => (
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
                  <span className="comment-item_id">Cita #{comment.cita_id}</span>
                </div>
                <p className="comment-item_text">{comment.comentario}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Stats */}
        <div className="dashboard-footer">
          <div className="footer-stats">
            <div className="footer-stat">
              <div className="footer-stat_icon footer-stat_icon--rose">
                <FaClipboardCheck size={20} />
              </div>
              <div className="footer-stat_content">
                <p className="footer-stat_label">Total Encuestas</p>
                <p className="footer-stat_value">{metricas_satisfaccion.total_encuestas}</p>
              </div>
            </div>
            <div className="footer-stat">
              <div className="footer-stat_icon footer-stat_icon--purple">
                <FaUsers size={20} />
              </div>
              <div className="footer-stat_content">
                <p className="footer-stat_label">Pacientes Nuevos</p>
                <p className="footer-stat_value">{metricas_satisfaccion.primera_visita.porcentaje_nuevos}%</p>
              </div>
            </div>
            <div className="footer-stat">
              <div className="footer-stat_icon footer-stat_icon--orange">
                <FaClock size={20} />
              </div>
              <div className="footer-stat_content">
                <p className="footer-stat_label">Consultas Totales</p>
                <p className="footer-stat_value">{kpis_generales.total_consultas}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; export default Dashboard;