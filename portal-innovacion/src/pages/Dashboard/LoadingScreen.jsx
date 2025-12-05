const LoadingScreen = () => (
  <div className="loading-screen">
    <div className="loading-content">
      <div className="loading-spinner">
        <div className="pulse-circle"></div>
        <div className="pulse-circle delay-1"></div>
        <div className="pulse-circle delay-2"></div>
      </div>
      <h3 className="loading-title">Cargando Dashboard</h3>
      <p className="loading-text">Obteniendo métricas y estadísticas...</p>
    </div>
  </div>
); export default LoadingScreen;